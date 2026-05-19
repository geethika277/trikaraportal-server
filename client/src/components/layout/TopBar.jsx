import { useState } from 'react';
import { Notifications, Menu, DarkMode, LightMode, Logout, Person, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifStore } from '@/store/notifStore';
import { notificationsApi } from '@/api/users';
import { timeAgo } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function TopBar({ onToggleSidebar, darkMode, onToggleDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { notifications, unreadCount, setNotifications, markRead, markAllRead } = useNotifStore();
  const qc = useQueryClient();

  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await notificationsApi.list();
      setNotifications(data.notifications, data.unreadCount);
      return data;
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => markAllRead(),
  });

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" onClick={onToggleDark}>
          {darkMode ? <LightMode className="h-4 w-4" /> : <DarkMode className="h-4 w-4" />}
        </Button>

        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => { setNotifOpen(p => !p); setUserOpen(false); }} className="relative">
            <Notifications className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={() => markReadMutation.mutate()} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => { markRead(n._id); notificationsApi.markRead(n._id); if (n.link) navigate(n.link); setNotifOpen(false); }}
                      className={`px-4 py-3 border-b cursor-pointer hover:bg-muted transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setUserOpen(p => !p); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden md:block">{user?.name?.split(' ')[0]}</span>
            <ExpandMore className="h-3 w-3 text-muted-foreground" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-12 w-48 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => { setUserOpen(false); navigate('/settings/profile'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Person className="h-4 w-4" /> Profile
              </button>
              <button
                onClick={() => { setUserOpen(false); logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <Logout className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
