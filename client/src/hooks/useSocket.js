import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';

export function useSocket() {
  const socketRef = useRef(null);
  const user = useAuthStore(s => s.user);
  const addNotification = useNotifStore(s => s.addNotification);

  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = io('/', { auth: { userId: user._id }, transports: ['websocket'] });

    socketRef.current.on('notification', (notif) => {
      addNotification(notif);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?._id]);

  return socketRef.current;
}
