import mongoose from 'mongoose';
import userModel from '../models/user.model.js';
import albumModel from '../models/album.model.js';
import musicModel from '../models/music.model.js';
import subscriptionModel from '../models/subscription.model.js';
import playHistoryModel from '../models/playHistory.model.js';
import AppError from '../errors/AppError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const getArtistPublicProfile = asyncHandler(async (req, res) => {
  const { artistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new AppError('Invalid artist ID', 400);
  }

  const artist = await userModel.findById(artistId).select('name username profilePicture role bio');
  if (!artist || artist.role !== 'artist') {
    throw new AppError('Artist not found', 404);
  }

  const [albums, singles, followerCount, totalPlays] = await Promise.all([
    albumModel.find({ artist: artistId }).sort({ createdAt: -1 }),
    musicModel.find({ artist: artistId }).sort({ createdAt: -1 }),
    subscriptionModel.countDocuments({ artistId }),
    playHistoryModel.countDocuments({ songId: { $in: (await musicModel.find({ artist: artistId }).select('_id')).map((m) => m._id) } }),
  ]);

  return ApiResponse.success(res, 'Artist profile fetched', {
    artist,
    followerCount,
    totalPlays,
    albums,
    singles,
  });
});

export default {
  getArtistPublicProfile,
};
