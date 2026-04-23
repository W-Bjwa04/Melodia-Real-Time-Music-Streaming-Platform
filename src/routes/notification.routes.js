import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import notificationController from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', authenticate, notificationController.getMyNotifications);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationController.markOneAsRead);
router.delete('/:id', authenticate, notificationController.deleteOne);

export default router;
