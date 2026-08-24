import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Icon from './Icon';
import Logo from './Logo';

export default function NavigationRail({ links }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'organization') return;
    const fetchBadge = async () => {
      try {
        const { default: api } = await import('../functions/api');
        const res = await api.get('/api/users/me/chat-badge');
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        // Silent fail
      }
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Helper to keep 'Tenders' active when viewing a specific tender detail route
  const checkIsActive = (linkTo, isRouterActive) => {
    if (isRouterActive) return true;
    if (linkTo === '/tenders' && location.pathname.startsWith('/tenders/')) return true;
    return false;
  };

  if (!links.length) return null;

  // Split links into main and system
  const mainLinks = links.filter(link => link.to !== '/org/profile');
  const systemLinks = links.filter(link => link.to === '/org/profile');

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-e border-border shrink-0 sticky top-0 h-screen z-40">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <Logo className="h-8 w-auto" />
        <div className="ms-auto">
          <span className="text-[10px] bg-paper border border-border px-2 py-0.5 rounded-full text-text-secondary font-bold">
            {user?.role === 'admin' ? 'لوحة المشرف' : user?.role === 'organization' ? 'لوحة المؤسسات' : 'لوحة الأفراد'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors focus-visible:outline-1 focus-visible:outline-registry-green ${
                checkIsActive(link.to, isActive)
                  ? 'bg-registry-green/10 text-registry-green font-semibold'
                  : 'text-text-secondary hover:text-ink hover:bg-paper'
              }`
            }
          >
            {({ isActive }) => {
              const effectiveActive = checkIsActive(link.to, isActive);
              return (
              <>
                <div className="flex items-center gap-3 relative w-full">
                  <Icon
                    name={
                      link.to.includes('dashboard') ? 'building' :
                      link.to.includes('tenders') ? 'document' :
                      link.to.includes('proposals') ? 'arrow' :
                      link.to.includes('auctions') ? 'gavel' :
                      link.to.includes('chat') ? 'chat' : 'document'
                    }
                    className={`h-[18px] w-[18px] ${effectiveActive ? 'text-registry-green' : 'text-text-secondary'}`}
                  />
                  <span>{link.label}</span>
                  {link.to === '/org/chat' && unreadCount > 0 && (
                    <span className="absolute end-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-white shadow-sm tabular-nums">
                      {unreadCount > 99 ? '+99' : unreadCount}
                    </span>
                  )}
                </div>
              </>
              );
            }}
          </NavLink>
        ))}

        {systemLinks.length > 0 && (
          <div className="pt-6 border-t border-border mt-6">
            <p className="px-3 text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2">النظام</p>
            {systemLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors focus-visible:outline-1 focus-visible:outline-registry-green ${
                    isActive
                      ? 'bg-registry-green/10 text-registry-green font-semibold'
                      : 'text-text-secondary hover:text-ink hover:bg-paper'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name="shield" className={`h-[18px] w-[18px] ${isActive ? 'text-registry-green' : 'text-text-secondary'}`} />
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Sidebar Profile Footer */}
      <div className="p-4 border-t border-border bg-paper/50 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-registry-green/10 text-registry-green font-display font-bold flex items-center justify-center text-sm border border-registry-green/20 shrink-0">
            {user?.companyName ? user.companyName.charAt(0) : user?.name?.charAt(0) || 'م'}
          </div>
          <div className="text-xs min-w-0 truncate">
            <p className="font-bold text-ink truncate">{user?.companyName || user?.name}</p>
            <p className="text-text-secondary truncate">
              {user?.status === 'approved' ? 'حساب مفعّل' : user?.status === 'pending' ? 'قيد المراجعة' : 'غير مكتمل'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-text-secondary hover:text-error p-1.5 rounded-lg hover:bg-paper transition-colors shrink-0 focus-visible:outline-1 focus-visible:outline-error"
          title="تسجيل الخروج"
        >
          <Icon name="arrow" className="h-[17px] w-[17px] rotate-180" />
        </button>
      </div>
    </aside>
  );
}

NavigationRail.propTypes = {
  links: PropTypes.arrayOf(PropTypes.shape({
    to: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired
};
