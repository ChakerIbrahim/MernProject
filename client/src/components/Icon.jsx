import PropTypes from 'prop-types';

const paths = {
  shield: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.7-3 8.6-7 10-4-1.4-7-5.3-7-10V6l7-3zM9 12l2 2 4-4" />,
  building: <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V5h8v16M14 9h4v12M9 8h2M9 12h2M9 16h2M16 12h1M16 16h1" />,
  document: <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 12h6M9 16h6" />,
  gavel: <path strokeLinecap="round" strokeLinejoin="round" d="M14 4l6 6M12 6l6 6M4 20l8-8M3 21l5-1 10-10-4-4L4 16l-1 5zM13 19h8" />,
  bell: <path strokeLinecap="round" strokeLinejoin="round" d="M18 9a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  olive: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V8M12 12c-4 1-6-1-6-4 3 0 6 1 6 4zM12 9c4-1 6-3 6-6-3 0-6 2-6 6zM12 16c-3 0-5-2-5-5 3 0 5 2 5 5zM12 18c4 0 6-2 6-5-3 0-6 2-6 5z" />,
  arrow: <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />,
  sparkle: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3zM19 16l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" />,
  chevron: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" />,
  close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />,
  clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  chat: <path strokeLinecap="round" strokeLinejoin="round" d="M7 18l-4 3 1.5-4.5A8 8 0 0112 4a8 8 0 018 8 8 8 0 01-8 8H7z" />,
  search: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 100-14.4 7.2 7.2 0 000 14.4z" />,
  refresh: <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 00-14.9-3.9L3 10m0 0V5m0 5h5M4 13a8 8 0 0014.9 3.9L21 14m0 0v5m0-5h-5" />,
  send: <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
};

export default function Icon({ name, className = 'h-6 w-6', strokeWidth = 1.7, title }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(paths)).isRequired,
  className: PropTypes.string,
  strokeWidth: PropTypes.number,
  title: PropTypes.string
};
