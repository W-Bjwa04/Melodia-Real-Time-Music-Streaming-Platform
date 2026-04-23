import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import userController from '../controllers/user.controller.js';

const router = express.Router();

router.patch('/notification-preference', authenticate, userController.updateNotificationPreference);

export default router;
