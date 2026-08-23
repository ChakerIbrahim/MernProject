/**
 * The data rail from design.md §5: a border-inline-start block of key/value
 * metadata, used on detail and card views instead of a decorative info box.
 *
 * @param {{label: string, value: React.ReactNode}[]} items
 */
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
