import { create } from 'zustand';

export const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  addNotification: (notif) => set(s => ({
    notifications: [notif, ...s.notifications].slice(0, 50),
    unreadCount: s.unreadCount + 1,
  })),
  markRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n._id === id ? { ...n, read: true } : n),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),
  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));
