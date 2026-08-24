import PropTypes from 'prop-types';

export default function ResponsiveTable({ headers, rows, renderMobileCard }) {
  if (!rows || rows.length === 0) return null;

  return (
    <>
      <div className="md:hidden space-y-4">
        {rows.map((row) => renderMobileCard(row))}
      </div>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border bg-paper text-ink">
            <tr>
              {headers.map((header, i) => (
                <th key={i} scope="col" className="p-4 text-start font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-paper/50 transition-colors">
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-4 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

ResponsiveTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    cells: PropTypes.arrayOf(PropTypes.node).isRequired,
    originalData: PropTypes.any
  })).isRequired,
  renderMobileCard: PropTypes.func.isRequired
};
