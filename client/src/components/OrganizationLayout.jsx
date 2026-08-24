import PropTypes from 'prop-types';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';

export default function OrganizationLayout({ children }) {
  const orgLinks = [
    { to: '/org/dashboard', label: 'لوحة التحكم' },
    { to: '/tenders', label: 'العطاءات المطروحة' },
    { to: '/tenders/new', label: 'طرح عطاء جديد' },
    { to: '/auctions/new', label: 'طرح مزاد جديد' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <Sidebar links={orgLinks} />
        <div className="flex-1 py-6 md:ps-6">
          {children}
        </div>
      </div>
    </div>
  );
}

OrganizationLayout.propTypes = {
  children: PropTypes.node.isRequired
};
