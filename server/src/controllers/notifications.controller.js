import Notification from '../models/Notification.js';

export async function listNotifications(req, res) {
  const notifs = await Notification.find({ user: req.user._id })
    .sort('-createdAt')
    .limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications: notifs, unreadCount });
}

export async function markRead(req, res) {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true, readAt: new Date() }
  );
  res.json({ message: 'Marked as read' });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true, readAt: new Date() });
  res.json({ message: 'All marked as read' });
}
