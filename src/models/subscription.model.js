import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    listenerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subscriptionSchema.index({ listenerId: 1, artistId: 1 }, { unique: true });

const subscriptionModel = mongoose.model('Subscription', subscriptionSchema);

export default subscriptionModel;
