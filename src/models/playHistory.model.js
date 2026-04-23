import mongoose from 'mongoose';

const playHistorySchema = new mongoose.Schema(
  {
    listenerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Music',
      required: true,
      index: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

const playHistoryModel = mongoose.model('PlayHistory', playHistorySchema);

export default playHistoryModel;
