import PropTypes from 'prop-types';

export default function DataRail({ title, items }) {
  return (
    <div className="space-y-4 border-e-2 border-registry-green bg-surface p-5 pe-6">
      {title ? <h2 className="text-xl font-bold text-ink">{title}</h2> : null}
      <div className="space-y-3 text-sm">
        {items.map((item) => (
          <p key={item.label} className="flex items-center justify-between gap-4">
            <span className="text-text-secondary">{item.label}</span>
            {typeof item.value === 'string' || typeof item.value === 'number' ? (
              <bdi className={item.tabular ? 'tabular-nums' : ''} dir={item.ltr ? 'ltr' : 'auto'}>
                {item.value}
              </bdi>
            ) : (
              item.value
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

DataRail.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.node.isRequired,
    tabular: PropTypes.bool,
    ltr: PropTypes.bool
  })).isRequired
};
