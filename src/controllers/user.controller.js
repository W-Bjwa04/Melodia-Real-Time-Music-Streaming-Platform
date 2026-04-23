import userModel from '../models/user.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../errors/AppError.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const updateNotificationPreference = asyncHandler(async (req, res) => {
  const { notificationsEnabled } = req.body;

  if (typeof notificationsEnabled !== 'boolean') {
    throw new AppError('notificationsEnabled must be a boolean', 400);
  }

  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    { notificationsEnabled },
    { new: true }
  ).select('notificationsEnabled');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return ApiResponse.success(res, 'Notification preference updated', {
    notificationsEnabled: user.notificationsEnabled,
  });
});

export default {
  updateNotificationPreference,
};
