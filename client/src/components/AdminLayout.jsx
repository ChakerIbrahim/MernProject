import PropTypes from 'prop-types';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';

/**
 * AdminLayout
 * Wraps admin pages with the global header and an admin-specific sidebar.
 * Used for the Bento-style admin dashboard and moderation views.
 */
export default function AdminLayout({ children }) {
  const adminLinks = [
    { to: '/admin/dashboard', label: 'لوحة التحكم' },
    { to: '/tenders', label: 'إدارة العطاءات' },
    { to: '/auctions', label: 'إدارة المزادات' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <Sidebar links={adminLinks} />
        <div className="flex-1 py-6 md:ps-6">
          {children}
        </div>
      </div>
    </div>
  );
}

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired
};
