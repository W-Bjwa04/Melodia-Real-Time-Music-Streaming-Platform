import notificationModel from '../models/notification.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationModel
    .find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  return ApiResponse.success(res, 'Notifications fetched', notifications);
});

const markOneAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationModel.findOneAndUpdate(
    { _id: id, recipientId: req.user._id },
    { read: true },
    { new: true }
  );

  return ApiResponse.success(res, 'Notification marked as read', notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationModel.updateMany(
    { recipientId: req.user._id, read: false },
    { read: true }
  );

  return ApiResponse.success(res, 'All notifications marked as read', null);
});

const deleteOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationModel.findOneAndDelete({ _id: id, recipientId: req.user._id });
  return ApiResponse.success(res, 'Notification deleted', null);
});

export default {
  getMyNotifications,
  markOneAsRead,
  markAllAsRead,
  deleteOne,
};
