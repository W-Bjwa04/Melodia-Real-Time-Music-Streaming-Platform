import notificationModel from '../models/notification.model.js';
import { getNotificationNamespace } from '../socket/index.js';
import { SOCKET_EVENTS, userRoom } from '../../shared/socketEvents.js';

export const createNotification = async ({ recipientId, type, payload }) => {
  return notificationModel.create({
    recipientId,
    type,
    payload,
    read: false,
  });
};

export const emitNotificationToUser = ({ recipientId, role, notification }) => {
  const nsp = getNotificationNamespace();
  if (!nsp) return;

  const userId = String(recipientId);
  nsp.to(userRoom(userId)).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
};

export const notifyUser = async ({ recipientId, recipientRole, type, payload }) => {
  const notification = await createNotification({ recipientId, type, payload });
  emitNotificationToUser({ recipientId, role: recipientRole, notification });
  return notification;
};
