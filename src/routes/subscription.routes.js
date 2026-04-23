import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import subscriptionController from '../controllers/subscription.controller.js';

const router = express.Router();

router.get('/', authenticate, subscriptionController.getMySubscriptions);
router.post('/', authenticate, subscriptionController.subscribeToArtist);
router.delete('/:artistId', authenticate, subscriptionController.unsubscribeFromArtist);

export default router;
