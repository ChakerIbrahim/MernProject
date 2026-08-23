
const DataRail = ({ items }) => (
  <dl className="border-s-2 border-border ps-4 text-sm">
    {items.map((item) => (
      <div key={item.label} className="mb-2 flex flex-wrap gap-x-2 last:mb-0">
        <dt className="text-text-secondary">{item.label}:</dt>
        <dd className="text-ink">{item.value}</dd>
      </div>
    ))}
  </dl>
);

export default DataRail;
