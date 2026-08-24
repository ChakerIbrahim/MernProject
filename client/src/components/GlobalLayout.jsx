import PropTypes from 'prop-types';
import AppHeader from './AppHeader';
import PublicHeader from './PublicHeader';
import NavigationRail from './NavigationRail';
import OrgMobileNav from './OrgMobileNav';
import { useAuth } from './AuthContext';

export default function GlobalLayout({ children }) {
  const { user } = useAuth();

  // Define links based on the user's role
  let links = [];

  if (user?.role === 'admin') {
    links = [
      { to: '/admin/dashboard', label: 'نظرة عامة' },
      { to: '/admin/users', label: 'إدارة الحسابات' },
      { to: '/admin/tenders', label: 'إدارة العطاءات' },
      { to: '/admin/auctions', label: 'إدارة المزادات' }
    ];
  } else if (user?.role === 'organization') {
    links = [
      { to: '/org/dashboard', label: 'الرئيسية' },
      { to: '/tenders', label: 'المنافسات' },
      { to: '/org/tenders', label: 'عطاءاتي' },
      { to: '/org/proposals', label: 'العروض' },
      { to: '/auctions', label: 'المزادات' },
      { to: '/org/chat', label: 'المحادثات' },
      { to: '/org/profile', label: 'ملف المؤسسة' }
    ];
  } else if (user?.role === 'individual') {
    links = [
      { to: '/dashboard', label: 'لوحة التحكم' },
      { to: '/auctions', label: 'تصفح المزادات' },
      { to: '/my-auctions', label: 'مزاداتي' }
    ];
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a href="#main-content" className="sr-only z-[60] rounded-md bg-registry-green px-4 py-3 text-surface focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus-visible:outline-1 focus-visible:outline-registry-green">تخطي إلى المحتوى الرئيسي</a>
      {user && links.length > 0 ? (
        <div className="flex min-h-screen">
          <NavigationRail links={links} />
          <div className="flex-1 min-w-0 flex flex-col">
            <AppHeader isBentoLayout={true} />
            <main id="main-content" className="flex-1 min-w-0 px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <>
          {user ? <AppHeader /> : <PublicHeader />}
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
            <main id="main-content" className="min-w-0 flex-1 py-6 pb-24 lg:pb-6 w-full max-w-full overflow-hidden">
              {children}
            </main>
          </div>
        </>
      )}
      {user?.role === 'organization' ? <OrgMobileNav /> : null}
    </div>
  );
}

GlobalLayout.propTypes = {
  children: PropTypes.node.isRequired
};
