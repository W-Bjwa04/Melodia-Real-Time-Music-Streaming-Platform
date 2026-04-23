import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['new_song', 'song_liked', 'new_comment'],
      index: true,
    },
    payload: {
      songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Music' },
      songTitle: { type: String, default: '' },
      coverImage: { type: String, default: '' },
      actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      actorName: { type: String, default: '' },
      actorAvatar: { type: String, default: '' },
      message: { type: String, default: '' },
      artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      commentText: { type: String, default: '' },
      commentId: { type: mongoose.Schema.Types.ObjectId },
      totalLikes: { type: Number, default: 0 },
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const notificationModel = mongoose.model('Notification', notificationSchema);

export default notificationModel;
