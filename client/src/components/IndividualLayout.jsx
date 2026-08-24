import PropTypes from 'prop-types';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';

export default function IndividualLayout({ children }) {
  const indLinks = [
    { to: '/dashboard', label: 'لوحة التحكم' },
    { to: '/auctions', label: 'تصفح المزادات' },
    { to: '/my-auctions', label: 'مزاداتي' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <Sidebar links={indLinks} />
        <div className="flex-1 py-6 md:ps-6">
          {children}
        </div>
      </div>
    </div>
  );
}

IndividualLayout.propTypes = {
  children: PropTypes.node.isRequired
};
