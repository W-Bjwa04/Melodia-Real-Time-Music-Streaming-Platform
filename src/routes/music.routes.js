import express from "express";
import authenticate from "../middlewares/authenticate.js";
import checkArtistRole from "../middlewares/role.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import musicController from "../controllers/music.controller.js";

const router = express.Router();

router.get("/",              authenticate, musicController.getAllMusic);
router.get("/trending",      authenticate, musicController.getTrendingSongs);
router.get("/recently-played", authenticate, musicController.getRecentlyPlayed);
router.post("/upload",       authenticate, checkArtistRole, upload.fields([{ name: "music", maxCount: 1 }, { name: "poster", maxCount: 1 }]), musicController.createMusic);
router.post("/create-album", authenticate, checkArtistRole, upload.fields([{ name: "albumCover", maxCount: 1 }]), musicController.createAlbum);
router.patch("/albums/:id", authenticate, checkArtistRole, upload.fields([{ name: "albumCover", maxCount: 1 }]), musicController.updateAlbum);
router.patch("/albums/:id/reorder", authenticate, checkArtistRole, musicController.reorderAlbumTracks);
router.post("/albums/:id/songs", authenticate, checkArtistRole, musicController.addSongsToAlbum);
router.delete("/albums/:id", authenticate, checkArtistRole, musicController.deleteAlbum);
router.post("/:id/like",     authenticate, musicController.toggleLikeMusic);
router.delete("/:id/like",   authenticate, musicController.dislikeMusic);
router.post("/:id/play",     authenticate, musicController.registerSongPlay);
router.get("/:id/comments",  authenticate, musicController.getMusicComments);
router.post("/:id/comments", authenticate, musicController.addCommentToMusic);
router.get("/album/:id",     authenticate, musicController.getAlbumDetails);
router.get("/music/:id",     authenticate, musicController.getMusicDetails);
router.get("/albums",        authenticate, musicController.getAllAlbums);
router.delete("/:id",        authenticate, checkArtistRole, musicController.deleteMusic);

export default router;
