import PropTypes from 'prop-types';
import PublicHeader from './PublicHeader';

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <PublicHeader />
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t border-border bg-surface py-8 text-center text-sm text-text-secondary">
        <p>&copy; {new Date().getFullYear()} منصة اعتماد. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}

PublicLayout.propTypes = {
  children: PropTypes.node.isRequired
};
