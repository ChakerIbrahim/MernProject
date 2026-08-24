import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';

const primaryLinks = [
  { to: '/org/dashboard', label: 'الرئيسية', icon: 'building' },
  { to: '/tenders', label: 'المنافسات', icon: 'document' },
  { to: '/org/tenders', label: 'عطاءاتي', icon: 'document' },
  { to: '/org/proposals', label: 'العروض', icon: 'arrow' }
];

export default function OrgMobileNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const moreButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const location = useLocation();

  const checkIsActive = (linkTo, isRouterActive) => {
    if (isRouterActive) return true;
    // When viewing a specific tender, highlight the "Marketplace/المنافسات" tab instead of "عطاءاتي"
    if (linkTo === '/tenders' && location.pathname.startsWith('/tenders/')) return true;
    return false;
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isMoreOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    drawerRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  return (
    <>
      <nav aria-label="تنقل المؤسسة على الهاتف" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-lg backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors focus-visible:outline-1 focus-visible:outline-registry-green ${checkIsActive(link.to, isActive) ? 'bg-registry-green/10 text-registry-green' : 'text-text-secondary hover:bg-paper hover:text-ink'}`}
            >
              {({ isActive }) => {
                const effectiveActive = checkIsActive(link.to, isActive);
                return (
                  <>
                    <Icon name={link.icon} className={`h-5 w-5 ${effectiveActive ? 'text-registry-green' : 'text-text-secondary'}`} />
                    <span>{link.label}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMoreOpen}
            className="relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium text-text-secondary transition-colors hover:bg-paper hover:text-ink focus-visible:outline-1 focus-visible:outline-registry-green"
          >
            <div className="relative">
              <Icon name="chevron" className="h-5 w-5 rotate-90" />
              {unreadCount > 0 && !isMoreOpen && (
                <span className="absolute -end-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface" aria-label="يوجد تنبيه" />
              )}
            </div>
            <span>المزيد</span>
          </button>
        </div>
      </nav>

      {isMoreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button type="button" className="absolute inset-0 h-full w-full bg-ink/35" onClick={() => setIsMoreOpen(false)} aria-label="إغلاق القائمة الثانوية" />
          <section ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="org-mobile-more-title" className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-ink/10 bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="org-mobile-more-title" className="font-display text-xl font-bold text-ink">المزيد</h2>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button type="button" onClick={() => { setIsMoreOpen(false); moreButtonRef.current?.focus(); }} aria-label="إغلاق القائمة الثانوية" className="rounded-lg p-2 text-text-secondary hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green">
                  <Icon name="chevron" className="h-5 w-5 rotate-90" />
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Link to="/auctions" onClick={() => setIsMoreOpen(false)} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="gavel" className="h-5 w-5 text-registry-green" />المزادات</Link>
              <Link to="/org/reports" onClick={() => setIsMoreOpen(false)} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="document" className="h-5 w-5 text-registry-green" />التقارير</Link>
              <Link to="/org/chat" onClick={() => setIsMoreOpen(false)} className="flex min-h-[48px] items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green">
                <div className="flex items-center gap-3"><Icon name="chat" className="h-5 w-5 text-registry-green" />المحادثات</div>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-white shadow-sm tabular-nums">
                    {unreadCount > 99 ? '+99' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/org/profile" onClick={() => setIsMoreOpen(false)} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="building" className="h-5 w-5 text-registry-green" />إعدادات المؤسسة والملف</Link>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
