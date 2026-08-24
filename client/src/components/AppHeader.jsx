import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Button from './Button';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../functions/backendUrl';

export default function AppHeader({ isBentoLayout = false }) {
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'organization') return;

    let isMounted = true;
    const fetchBadge = async () => {
      try {
        const { default: api } = await import('../functions/api');
        const res = await api.get('/api/users/me/chat-badge');
        if (isMounted) setUnreadCount(res.data.count || 0);
      } catch (err) {
        // Silent fail for badge
      }
    };

    fetchBadge();
    const interval = setInterval(fetchBadge, 30000);

    // Connect a lightweight socket just for global notifications
    const socket = io(API_ORIGIN || window.location.origin, {
      withCredentials: true,
      auth: { token }
    });

    // We don't join a specific room here; we just listen to a global notification event
    // that the server will emit when any message is sent to this user
    socket.on('connect', () => {
      socket.emit('join_global_notifications');
    });

    socket.on('unread_badge_update', (data) => {
      if (isMounted && data.count !== undefined) {
        setUnreadCount(data.count);
      } else {
        fetchBadge();
      }
    });

    // Also listen to custom window events from the negotiation page
    const handleLocalUpdate = () => fetchBadge();
    window.addEventListener('chat_badge_update', handleLocalUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      socket.disconnect();
      window.removeEventListener('chat_badge_update', handleLocalUpdate);
    };
  }, [user, token]);

  if (isBentoLayout) {
    return (
      <header className="sticky top-0 z-30 bg-surface border-b border-border w-full">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Search Field Placeholder */}
          <div className="flex items-center gap-2 w-full max-w-md bg-paper border border-border rounded-xl px-3.5 py-2">
            <Icon name="document" className="h-[17px] w-[17px] text-text-secondary" />
            <input type="text" placeholder="ابحث عن عطاءات، مزادات، أو عروض..." className="bg-transparent text-sm text-ink placeholder:text-text-secondary outline-none w-full" />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link to={user?.role === 'organization' ? '/org/chat' : '/'} aria-label="التنبيهات والمحادثات" className="relative p-2 rounded-xl hover:bg-paper text-text-secondary border border-border focus-visible:outline-1 focus-visible:outline-registry-green">
              <Icon name="chat" className="h-[19px] w-[19px]" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1.5 -start-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white shadow-sm" aria-label={`${unreadCount} تنبيه`}>
                  {unreadCount > 99 ? '+99' : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-1 focus-visible:outline-registry-green">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link to={user?.role === 'organization' ? '/org/chat' : '/'} aria-label="التنبيهات والمحادثات" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-paper hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green">
            <Icon name="chat" className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute end-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white shadow-sm" aria-label={`${unreadCount} تنبيه`}>
                {unreadCount > 99 ? '+99' : unreadCount}
              </span>
            ) : null}
          </Link>
          <div className="flex min-w-0 items-center gap-2 text-sm text-text-secondary" title={user?.companyName || user?.name}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-registry-green/10 text-registry-green">
              <Icon name={user?.role === 'organization' ? 'building' : 'shield'} className="h-4 w-4" />
            </span>
            <bdi className="max-w-[120px] truncate font-medium text-ink sm:max-w-[200px]" aria-label={user?.companyName || user?.name}>{user?.companyName || user?.name}</bdi>
          </div>
          <Button variant="secondary" onClick={logout} className="hidden sm:inline-flex">تسجيل الخروج</Button>
        </div>
      </div>
    </header>
  );
}
