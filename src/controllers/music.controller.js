import fs from 'fs/promises';
import mongoose from 'mongoose';
import { parseFile } from 'music-metadata';
import albumModel from '../models/album.model.js';
import musicModel from '../models/music.model.js';
import playHistoryModel from '../models/playHistory.model.js';
import playlistModel from '../models/playlist.model.js';
import subscriptionModel from '../models/subscription.model.js';
import logger from '../config/logger.js';
import AppError from '../errors/AppError.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import storageService from '../services/storage.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { notifyUser } from '../services/notification.service.js';
import { getIO, getNotificationNamespace } from '../socket/index.js';
import { artistRoom, SOCKET_EVENTS, userRoom } from '../../shared/socketEvents.js';

const songSelect = 'title artist poster uri likes likedBy comments duration trackNumber genre playCount createdAt';

const emitTrendingUpdated = async () => {
  const nsp = getNotificationNamespace();
  if (!nsp) return;

  const trending = await musicModel
    .find()
    .select(songSelect)
    .sort({ likes: -1, createdAt: -1 })
    .limit(10)
    .populate({ path: 'artist', select: 'name profilePicture' });

  console.log(`[Socket Emit] trending_updated → ${trending.length} songs → all clients in /notifications`);
  nsp.emit(SOCKET_EVENTS.TRENDING_UPDATED, { songs: trending });
};

const notifySubscribersAboutSong = async (artistId, songPayload) => {
  const nsp = getNotificationNamespace();
  if (nsp) {
    console.log(`[Socket Emit] new_song_uploaded → room: artist_${artistId}`);
    nsp.to(artistRoom(String(artistId))).emit(SOCKET_EVENTS.NEW_SONG_UPLOADED, {
      song: songPayload,
      message: 'New song uploaded',
    });
  }

  const subscriptions = await subscriptionModel.find({ artistId }).select('listenerId');
  await Promise.all(
    subscriptions.map((sub) =>
      notifyUser({
        recipientId: sub.listenerId,
        recipientRole: 'listener',
        type: 'new_song',
        payload: {
          message: 'New song uploaded',
          songId: songPayload._id,
          songTitle: songPayload.title,
          coverImage: songPayload.coverImage,
          actorId: artistId,
          actorName: songPayload.artist?.name || '',
          actorAvatar: '',
          artistId,
        },
      })
    )
  );
};

const createMusic = asyncHandler(async (req, res) => {
  const musicPath = req.files?.music?.[0]?.path;
  const posterPath = req.files?.poster?.[0]?.path;

  if (!musicPath) {
    throw new AppError('Music file is required', 400);
  }

  const { title, genre = '' } = req.body;
  if (!title?.trim()) {
    await fs.unlink(musicPath).catch(() => {});
    if (posterPath) await fs.unlink(posterPath).catch(() => {});
    throw new AppError('Title is required', 400);
  }

  let uploadMusicResponse;
  let uploadPosterResponse;

  try {
    const metadata = await parseFile(musicPath).catch(() => null);
    const duration = Number(metadata?.format?.duration || 0);

    const musicFileName = `${Date.now()}-${req.files['music'][0].originalname}`;
    uploadMusicResponse = await storageService.uploadFile(musicPath, musicFileName);
    if (!uploadMusicResponse) {
      throw new AppError('Failed to upload music file to storage', 500);
    }

    if (posterPath) {
      const posterFileName = `${Date.now()}-${req.files['poster'][0].originalname}`;
      uploadPosterResponse = await storageService.uploadFile(posterPath, posterFileName);
      if (!uploadPosterResponse) {
        throw new AppError('Failed to upload poster file to storage', 500);
      }
    }

    await fs.unlink(musicPath).catch(() => {});
    if (posterPath) await fs.unlink(posterPath).catch(() => {});

    const savedMusic = await musicModel.create({
      uri: uploadMusicResponse.url,
      title: title.trim(),
      genre: genre.trim(),
      artist: req.user._id,
      poster: uploadPosterResponse?.url || '',
      duration,
      likes: 0,
      likedBy: [],
    });

    const populatedMusic = await savedMusic.populate({ path: 'artist', select: 'name profilePicture' });

    await notifySubscribersAboutSong(req.user._id, {
      _id: populatedMusic._id,
      title: populatedMusic.title,
      coverImage: populatedMusic.poster,
      duration: populatedMusic.duration,
      artist: {
        _id: req.user._id,
        name: req.user.name,
      },
    });

    logger.info('Music track uploaded', {
      title: populatedMusic.title,
      uploadedBy: req.user._id,
      musicId: populatedMusic._id,
    });

    return ApiResponse.created(res, 'Music uploaded successfully', populatedMusic);
  } catch (error) {
    await fs.unlink(musicPath).catch(() => {});
    if (posterPath) await fs.unlink(posterPath).catch(() => {});
    throw error;
  }
});

const createAlbum = asyncHandler(async (req, res) => {
  const posterPath = req.files?.albumCover?.[0]?.path;
  const { title, genre = '', releaseYear } = req.body;

  if (!title?.trim()) {
    if (posterPath) await fs.unlink(posterPath).catch(() => {});
    throw new AppError('Title is required', 400);
  }

  let tracks = req.body.music;
  if (typeof tracks === 'string') {
    tracks = JSON.parse(tracks);
  }

  if (!Array.isArray(tracks) || !tracks.length) {
    if (posterPath) await fs.unlink(posterPath).catch(() => {});
    throw new AppError('Music array is required and must not be empty', 400);
  }

  const uniqueMusicIds = [...new Set(tracks.map(String))];
  const hasInvalidId = uniqueMusicIds.some((id) => !mongoose.Types.ObjectId.isValid(id));
  if (hasInvalidId) {
    if (posterPath) await fs.unlink(posterPath).catch(() => {});
    throw new AppError('One or more music IDs are invalid', 400);
  }

  const ownedTracksCount = await musicModel.countDocuments({
    _id: { $in: uniqueMusicIds },
    artist: req.user._id,
  });

  if (ownedTracksCount !== uniqueMusicIds.length) {
    if (posterPath) await fs.unlink(posterPath).catch(() => {});
    throw new AppError('You can only add your own songs to an album', 403);
  }

  if (!posterPath) {
    throw new AppError('Album cover is required', 400);
  }

  const posterFileName = `${Date.now()}-${req.files['albumCover'][0].originalname}`;
  const uploadPosterResponse = await storageService.uploadFile(posterPath, posterFileName);
  if (!uploadPosterResponse) {
    throw new AppError('Failed to upload album cover', 500);
  }
  await fs.unlink(posterPath).catch(() => {});

  const album = await albumModel.create({
    title: title.trim(),
    genre: genre.trim(),
    releaseYear: releaseYear ? Number(releaseYear) : null,
    artist: req.user._id,
    uploadedDate: new Date(),
    tracks: uniqueMusicIds,
    albumCover: uploadPosterResponse.url,
  });

  await Promise.all(
    uniqueMusicIds.map((songId, idx) =>
      musicModel.findByIdAndUpdate(songId, { trackNumber: idx + 1 })
    )
  );

  const albumResponse = await albumModel
    .findById(album._id)
    .populate({ path: 'artist', select: 'name profilePicture' });

  return ApiResponse.created(res, 'Album created successfully', albumResponse);
});

const updateAlbum = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, genre, releaseYear } = req.body;

  const album = await albumModel.findById(id);
  if (!album) throw new AppError('Album not found', 404);
  if (String(album.artist) !== String(req.user._id)) throw new AppError('Only artist can update album', 403);

  if (title !== undefined) album.title = title.trim();
  if (genre !== undefined) album.genre = genre.trim();
  if (releaseYear !== undefined) album.releaseYear = releaseYear ? Number(releaseYear) : null;

  if (req.files?.albumCover?.[0]?.path) {
    const posterPath = req.files.albumCover[0].path;
    const posterFileName = `${Date.now()}-${req.files.albumCover[0].originalname}`;
    const uploadPosterResponse = await storageService.uploadFile(posterPath, posterFileName);
    if (uploadPosterResponse?.url) {
      album.albumCover = uploadPosterResponse.url;
    }
    await fs.unlink(posterPath).catch(() => {});
  }

  await album.save();
  const updated = await album.populate({ path: 'artist', select: 'name profilePicture' });
  return ApiResponse.success(res, 'Album updated', updated);
});

const reorderAlbumTracks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tracks } = req.body;

  if (!Array.isArray(tracks) || !tracks.length) {
    throw new AppError('Tracks array is required', 400);
  }

  const album = await albumModel.findById(id);
  if (!album) throw new AppError('Album not found', 404);
  if (String(album.artist) !== String(req.user._id)) throw new AppError('Only artist can reorder tracks', 403);

  album.tracks = tracks;
  await album.save();

  await Promise.all(
    tracks.map((songId, idx) => musicModel.findByIdAndUpdate(songId, { trackNumber: idx + 1 }))
  );

  const updated = await albumModel.findById(id).populate({ path: 'tracks', select: songSelect });
  return ApiResponse.success(res, 'Album tracks reordered', updated);
});

const addSongsToAlbum = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { songIds = [] } = req.body;

  const album = await albumModel.findById(id);
  if (!album) throw new AppError('Album not found', 404);
  if (String(album.artist) !== String(req.user._id)) throw new AppError('Only artist can update album', 403);

  const validSongIds = songIds.filter((songId) => mongoose.Types.ObjectId.isValid(songId)).map(String);
  const merged = [...new Set([...album.tracks.map(String), ...validSongIds])];
  album.tracks = merged;
  await album.save();

  await Promise.all(
    merged.map((songId, idx) => musicModel.findByIdAndUpdate(songId, { trackNumber: idx + 1 }))
  );

  const updated = await albumModel.findById(id).populate({ path: 'tracks', select: songSelect });
  return ApiResponse.success(res, 'Songs added to album', updated);
});

const deleteAlbum = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cascadeDeleteSongs = false } = req.body;

  const album = await albumModel.findById(id);
  if (!album) throw new AppError('Album not found', 404);
  if (String(album.artist) !== String(req.user._id)) throw new AppError('Only artist can delete album', 403);

  const trackIds = album.tracks.map(String);

  if (cascadeDeleteSongs) {
    await musicModel.deleteMany({ _id: { $in: trackIds }, artist: req.user._id });
    await playlistModel.updateMany({ tracks: { $in: trackIds } }, { $pull: { tracks: { $in: trackIds } } });
  } else {
    await Promise.all(trackIds.map((songId, idx) => musicModel.findByIdAndUpdate(songId, { trackNumber: idx + 1 })));
  }

  await albumModel.findByIdAndDelete(id);
  await emitTrendingUpdated();

  return ApiResponse.success(res, 'Album deleted successfully', null);
});

const getAlbumDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid album ID', 400);
  }

  const album = await albumModel
    .findById(id)
    .select('title genre releaseYear artist albumCover uploadedDate tracks')
    .populate([
      { path: 'artist', select: 'name profilePicture' },
      { path: 'tracks', select: songSelect },
    ]);

  if (!album) {
    throw new AppError('Album not found', 404);
  }

  return ApiResponse.success(res, 'Album fetched', album);
});

const getMusicDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  const music = await musicModel
    .findById(id)
    .select(songSelect)
    .populate({ path: 'artist', select: 'name profilePicture' })
    .populate({ path: 'comments.user', select: 'name username profilePicture' });

  if (!music) {
    throw new AppError('Music not found', 404);
  }

  return ApiResponse.success(res, 'Music fetched', music);
});

const getAllMusic = asyncHandler(async (req, res) => {
  const tracks = await musicModel
    .find()
    .select(songSelect)
    .sort({ createdAt: -1 })
    .populate({ path: 'artist', select: 'name profilePicture' });

  return ApiResponse.success(res, 'Tracks fetched', tracks);
});

const getTrendingSongs = asyncHandler(async (req, res) => {
  const tracks = await musicModel
    .find()
    .select(songSelect)
    .sort({ likes: -1, createdAt: -1 })
    .limit(10)
    .populate({ path: 'artist', select: 'name profilePicture' });

  return ApiResponse.success(res, 'Trending songs fetched', tracks);
});

const getAllAlbums = asyncHandler(async (req, res) => {
  const albums = await albumModel
    .find()
    .select('title genre releaseYear artist albumCover uploadedDate tracks')
    .sort({ createdAt: -1 })
    .populate({ path: 'artist', select: 'name profilePicture' });

  return ApiResponse.success(res, 'Albums fetched', albums);
});

const toggleLikeMusic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  const music = await musicModel.findById(id).populate({ path: 'artist', select: 'name profilePicture role' });
  if (!music) {
    throw new AppError('Music not found', 404);
  }

  const userId = String(req.user._id);
  const liked = music.likedBy.some((u) => String(u) === userId);

  if (liked) {
    music.likedBy = music.likedBy.filter((u) => String(u) !== userId);
    music.likes = Math.max(0, Number(music.likes || 0) - 1);
  } else {
    music.likedBy.push(req.user._id);
    music.likes = Number(music.likes || 0) + 1;
  }

  await music.save();

  if (!liked && String(music.artist?._id || music.artist) !== String(req.user._id)) {
    await notifyUser({
      recipientId: music.artist?._id || music.artist,
      recipientRole: 'artist',
      type: 'song_liked',
      payload: {
        actorId: req.user._id,
        actorName: req.user.name,
        actorAvatar: req.user.profilePicture,
        songTitle: music.title,
        songId: music._id,
        message: `${req.user.name} liked your song ${music.title}`,
        totalLikes: music.likes,
      },
    });

    const nsp = getNotificationNamespace();
    if (nsp) {
      console.log(`[Socket Emit] song_liked → room: user_${music.artist?._id || music.artist}`);
      nsp.to(userRoom(String(music.artist?._id || music.artist))).emit(SOCKET_EVENTS.SONG_LIKED, {
        listenerName: req.user.name,
        listenerAvatar: req.user.profilePicture,
        songTitle: music.title,
        songId: music._id,
        totalLikes: music.likes,
      });
    }
  }

  await emitTrendingUpdated();

  return ApiResponse.success(res, liked ? 'Song unliked' : 'Song liked', {
    liked: !liked,
    likesCount: music.likes,
  });
});

const dislikeMusic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  const music = await musicModel.findById(id);
  if (!music) {
    throw new AppError('Music not found', 404);
  }

  const userId = String(req.user._id);
  music.likedBy = music.likedBy.filter((u) => String(u) !== userId);
  music.likes = music.likedBy.length;
  await music.save();

  await emitTrendingUpdated();

  return ApiResponse.success(res, 'Song disliked', {
    liked: false,
    likesCount: music.likes,
  });
});

const addCommentToMusic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  if (!text?.trim()) {
    throw new AppError('Comment text is required', 400);
  }

  const music = await musicModel.findById(id).populate({ path: 'artist', select: 'name profilePicture role' });
  if (!music) {
    throw new AppError('Music not found', 404);
  }

  music.comments.push({
    user: req.user._id,
    text: text.trim(),
  });
  await music.save();

  const latestComment = music.comments[music.comments.length - 1];

  if (String(music.artist?._id || music.artist) !== String(req.user._id)) {
    await notifyUser({
      recipientId: music.artist?._id || music.artist,
      recipientRole: 'artist',
      type: 'new_comment',
      payload: {
        actorId: req.user._id,
        actorName: req.user.name,
        actorAvatar: req.user.profilePicture,
        songTitle: music.title,
        songId: music._id,
        message: `${req.user.name} commented on ${music.title}`,
        commentText: latestComment.text,
        commentId: latestComment._id,
      },
    });
  }

  const nsp = getNotificationNamespace();
  if (nsp) {
    nsp.to(artistRoom(String(music.artist?._id || music.artist))).emit(SOCKET_EVENTS.NEW_COMMENT_BROADCAST, {
      songId: music._id,
      songTitle: music.title,
      comment: {
        _id: latestComment._id,
        text: latestComment.text,
        user: {
          _id: req.user._id,
          name: req.user.name,
          username: req.user.username,
          profilePicture: req.user.profilePicture,
        },
        createdAt: latestComment.createdAt,
      },
    });

    console.log(`[Socket Emit] new_comment → room: artist_${music.artist?._id || music.artist}`);
    nsp.to(artistRoom(String(music.artist?._id || music.artist))).emit(SOCKET_EVENTS.NEW_COMMENT, {
      listenerName: req.user.name,
      listenerAvatar: req.user.profilePicture,
      songTitle: music.title,
      songId: music._id,
      commentText: latestComment.text,
      commentId: latestComment._id,
    });
  }

  const populated = await musicModel.findById(id).populate({
    path: 'comments.user',
    select: 'name username profilePicture',
  });

  return ApiResponse.success(res, 'Comment added', populated.comments);
});

const getMusicComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  const music = await musicModel.findById(id).populate({
    path: 'comments.user',
    select: 'name username profilePicture',
  });

  if (!music) {
    throw new AppError('Music not found', 404);
  }

  return ApiResponse.success(res, 'Comments fetched', music.comments);
});

const registerSongPlay = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  const music = await musicModel.findById(id);
  if (!music) {
    throw new AppError('Music not found', 404);
  }

  music.playCount = Number(music.playCount || 0) + 1;
  await music.save();

  if (req.user.role === 'listener') {
    await playHistoryModel.create({
      listenerId: req.user._id,
      songId: id,
      playedAt: new Date(),
    });
  }

  return ApiResponse.success(res, 'Song play tracked', {
    playCount: music.playCount,
  });
});

const getRecentlyPlayed = asyncHandler(async (req, res) => {
  const items = await playHistoryModel
    .find({ listenerId: req.user._id })
    .sort({ playedAt: -1 })
    .limit(200)
    .populate({ path: 'songId', populate: { path: 'artist', select: 'name profilePicture' } });

  const unique = [];
  const seen = new Set();
  for (const item of items) {
    const song = item.songId;
    if (!song) continue;
    const key = String(song._id);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(song);
    if (unique.length >= 20) break;
  }

  return ApiResponse.success(res, 'Recently played fetched', unique);
});

const deleteMusic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid music ID', 400);
  }

  const song = await musicModel.findById(id);
  if (!song) throw new AppError('Music not found', 404);
  if (String(song.artist) !== String(req.user._id)) {
    throw new AppError('Only artist can delete song', 403);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await playlistModel.updateMany(
      { tracks: song._id },
      { $pull: { tracks: song._id } },
      { session }
    );

    await albumModel.updateMany(
      { tracks: song._id },
      { $pull: { tracks: song._id } },
      { session }
    );

    await playHistoryModel.deleteMany({ songId: song._id }, { session });
    await musicModel.deleteOne({ _id: song._id }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  const nsp = getNotificationNamespace();
  if (nsp) {
    nsp.to(artistRoom(String(req.user._id))).emit(SOCKET_EVENTS.SONG_DELETED, {
      songId: id,
      message: 'Song deleted by artist',
    });
  }

  await emitTrendingUpdated();

  return ApiResponse.success(res, 'Song deleted successfully', null);
});

export default {
  createMusic,
  createAlbum,
  updateAlbum,
  reorderAlbumTracks,
  addSongsToAlbum,
  deleteAlbum,
  getAlbumDetails,
  getMusicDetails,
  getAllMusic,
  getTrendingSongs,
  getAllAlbums,
  toggleLikeMusic,
  dislikeMusic,
  addCommentToMusic,
  getMusicComments,
  registerSongPlay,
  getRecentlyPlayed,
  deleteMusic,
};
