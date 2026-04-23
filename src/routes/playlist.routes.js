import express from "express";
import authenticate from "../middlewares/authenticate.js";
import playlistController from "../controllers/playlist.controller.js";

const router = express.Router();

router.get("/mine", authenticate, playlistController.getMyPlaylists);
router.get("/public", authenticate, playlistController.getPublicPlaylists);
router.get("/:id", authenticate, playlistController.getPlaylistDetails);

router.post("/", authenticate, playlistController.createPlaylist);
router.patch("/:id", authenticate, playlistController.updatePlaylist);
router.delete("/:id", authenticate, playlistController.deletePlaylist);

router.post("/:id/tracks", authenticate, playlistController.addTrackToPlaylist);
router.delete("/:id/tracks/:trackId", authenticate, playlistController.removeTrackFromPlaylist);
router.delete("/:playlistId/songs/:songId", authenticate, playlistController.removeSongFromPlaylist);
router.post("/:id/like", authenticate, playlistController.toggleLikePlaylist);

export default router;
