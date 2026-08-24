import PropTypes from 'prop-types';

export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border-2 border-ink/15 bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
