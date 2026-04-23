import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import artistController from '../controllers/artist.controller.js';

const router = express.Router();

router.get('/:artistId/profile', authenticate, artistController.getArtistPublicProfile);

export default router;
