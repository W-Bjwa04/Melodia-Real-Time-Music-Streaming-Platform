import mongoose from 'mongoose';
import subscriptionModel from '../models/subscription.model.js';
import userModel from '../models/user.model.js';
import AppError from '../errors/AppError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await subscriptionModel
    .find({ listenerId: req.user._id })
    .populate({ path: 'artistId', select: 'name username profilePicture role' })
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Subscriptions fetched', subscriptions);
});

const subscribeToArtist = asyncHandler(async (req, res) => {
  const { artistId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new AppError('Invalid artist ID', 400);
  }

  const artist = await userModel.findById(artistId).select('role');
  if (!artist || artist.role !== 'artist') {
    throw new AppError('Artist not found', 404);
  }

  await subscriptionModel.findOneAndUpdate(
    { listenerId: req.user._id, artistId },
    { listenerId: req.user._id, artistId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return ApiResponse.success(res, 'Subscribed to artist', { subscribed: true, artistId });
});

const unsubscribeFromArtist = asyncHandler(async (req, res) => {
  const { artistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new AppError('Invalid artist ID', 400);
  }

  await subscriptionModel.findOneAndDelete({ listenerId: req.user._id, artistId });

  return ApiResponse.success(res, 'Unsubscribed from artist', { subscribed: false, artistId });
});

export default {
  getMySubscriptions,
  subscribeToArtist,
  unsubscribeFromArtist,
};
