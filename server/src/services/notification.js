import Notification from '../models/Notification.js';

let _io = null;

export function initNotificationService(io) {
  _io = io;
}

export async function createNotification({ userId, type, title, message = '', relatedModel = '', relatedId = null, link = '' }) {
  const notif = await Notification.create({ user: userId, type, title, message, relatedModel, relatedId, link });
  if (_io) {
    _io.to(`user:${userId}`).emit('notification', notif);
  }
  return notif;
}

export async function notifyMany(userIds, payload) {
  return Promise.all(userIds.map(id => createNotification({ userId: id, ...payload })));
}
