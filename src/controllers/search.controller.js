import playlistModel from "../models/playlist.model.js";
import musicModel from "../models/music.model.js";
import albumModel from "../models/album.model.js";
import userModel from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const searchAll = asyncHandler(async (req, res) => {
    const query = String(req.query.q || "").trim();

    if (!query) {
        return ApiResponse.success(res, "Search results", {
            tracks: [],
            albums: [],
            artists: [],
            playlists: [],
        });
    }

    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [tracks, albums, artists, playlists] = await Promise.all([
        musicModel
            .find({ title: pattern })
            .limit(30)
            .sort({ createdAt: -1 })
            .populate({ path: "artist", select: "name profilePicture" }),
        albumModel
            .find({ title: pattern })
            .limit(20)
            .sort({ createdAt: -1 })
            .populate({ path: "artist", select: "name profilePicture" }),
        userModel
            .find({ $or: [{ name: pattern }, { username: pattern }] })
            .limit(20)
            .select("name username role profilePicture"),
        playlistModel
            .find({
                isPublic: true,
                name: pattern,
            })
            .limit(20)
            .sort({ updatedAt: -1 })
            .populate({ path: "owner", select: "name username profilePicture" }),
    ]);

    return ApiResponse.success(res, "Search results", {
        tracks,
        albums,
        artists,
        playlists,
    });
});

export default { searchAll };
