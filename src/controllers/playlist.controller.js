import mongoose from "mongoose";
import playlistModel from "../models/playlist.model.js";
import musicModel from "../models/music.model.js";
import AppError from "../errors/AppError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const basePlaylistPopulate = [
    { path: "owner", select: "name username profilePicture" },
    { path: "tracks", select: "title uri poster artist likes likedBy comments duration trackNumber", populate: { path: "artist", select: "name profilePicture" } },
];

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description = "", isPublic = true } = req.body;

    if (!name?.trim()) {
        throw new AppError("Playlist name is required", 400);
    }

    const playlist = await playlistModel.create({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        owner: req.user._id,
        tracks: [],
    });

    const populated = await playlist.populate(basePlaylistPopulate);
    return ApiResponse.created(res, "Playlist created", populated);
});

const getMyPlaylists = asyncHandler(async (req, res) => {
    const playlists = await playlistModel
        .find({ owner: req.user._id })
        .sort({ updatedAt: -1 })
        .populate(basePlaylistPopulate);

    return ApiResponse.success(res, "Your playlists fetched", playlists);
});

const getPublicPlaylists = asyncHandler(async (req, res) => {
    const playlists = await playlistModel
        .find({ isPublic: true })
        .sort({ updatedAt: -1 })
        .populate(basePlaylistPopulate);

    return ApiResponse.success(res, "Public playlists fetched", playlists);
});

const getPlaylistDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid playlist ID", 400);
    }

    const playlist = await playlistModel.findById(id).populate(basePlaylistPopulate);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    const isOwner = String(playlist.owner?._id || playlist.owner) === String(req.user._id);
    if (!playlist.isPublic && !isOwner) {
        throw new AppError("This playlist is private", 403);
    }

    return ApiResponse.success(res, "Playlist fetched", playlist);
});

const addTrackToPlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { trackId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackId)) {
        throw new AppError("Invalid playlist or track ID", 400);
    }

    const playlist = await playlistModel.findById(id);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    if (String(playlist.owner) !== String(req.user._id)) {
        throw new AppError("Only playlist owner can modify playlist", 403);
    }

    const trackExists = await musicModel.exists({ _id: trackId });
    if (!trackExists) {
        throw new AppError("Track not found", 404);
    }

    if (!playlist.tracks.some((t) => String(t) === String(trackId))) {
        playlist.tracks.push(trackId);
        await playlist.save();
    }

    const populated = await playlist.populate(basePlaylistPopulate);
    return ApiResponse.success(res, "Track added to playlist", populated);
});

const removeTrackFromPlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { trackId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackId)) {
        throw new AppError("Invalid playlist or track ID", 400);
    }

    const playlist = await playlistModel.findById(id);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    if (String(playlist.owner) !== String(req.user._id)) {
        throw new AppError("Only playlist owner can modify playlist", 403);
    }

    playlist.tracks = playlist.tracks.filter((t) => String(t) !== String(trackId));
    await playlist.save();

    const populated = await playlist.populate(basePlaylistPopulate);
    return ApiResponse.success(res, "Track removed from playlist", populated);
});

const toggleLikePlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid playlist ID", 400);
    }

    const playlist = await playlistModel.findById(id);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    const userId = String(req.user._id);
    const liked = playlist.likes.some((u) => String(u) === userId);

    if (liked) {
        playlist.likes = playlist.likes.filter((u) => String(u) !== userId);
    } else {
        playlist.likes.push(req.user._id);
    }

    playlist.likesCount = playlist.likes.length;

    await playlist.save();

    return ApiResponse.success(res, liked ? "Playlist unliked" : "Playlist liked", {
        liked: !liked,
        likesCount: playlist.likesCount,
    });
});

const removeSongFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, songId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(songId)) {
        throw new AppError("Invalid playlist or song ID", 400);
    }

    const playlist = await playlistModel.findById(playlistId);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    if (String(playlist.owner) !== String(req.user._id)) {
        throw new AppError("Only playlist owner can modify playlist", 403);
    }

    playlist.tracks = playlist.tracks.filter((t) => String(t) !== String(songId));
    await playlist.save();

    const populated = await playlist.populate(basePlaylistPopulate);
    return ApiResponse.success(res, "Song removed from playlist", populated);
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid playlist ID", 400);
    }

    const playlist = await playlistModel.findById(id);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    if (String(playlist.owner) !== String(req.user._id)) {
        throw new AppError("Only playlist owner can update playlist", 403);
    }

    if (name !== undefined) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (isPublic !== undefined) playlist.isPublic = Boolean(isPublic);
    await playlist.save();

    const populated = await playlist.populate(basePlaylistPopulate);
    return ApiResponse.success(res, "Playlist updated", populated);
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid playlist ID", 400);
    }

    const playlist = await playlistModel.findById(id);
    if (!playlist) {
        throw new AppError("Playlist not found", 404);
    }

    if (String(playlist.owner) !== String(req.user._id)) {
        throw new AppError("Only playlist owner can delete playlist", 403);
    }

    await playlistModel.findByIdAndDelete(id);
    return ApiResponse.success(res, "Playlist deleted", null);
});

export default {
    createPlaylist,
    getMyPlaylists,
    getPublicPlaylists,
    getPlaylistDetails,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    removeSongFromPlaylist,
    toggleLikePlaylist,
    updatePlaylist,
    deletePlaylist,
};
