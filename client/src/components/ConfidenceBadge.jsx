import PropTypes from 'prop-types';

export default function ConfidenceBadge({ score }) {
  if (typeof score !== 'number') return null;

  let levelClass = '';
  let label = '';

  if (score >= 80) {
    levelClass = 'bg-surface border-success text-success';
    label = 'ثقة عالية';
  } else if (score >= 50) {
    levelClass = 'bg-surface border-warning text-warning';
    label = 'ثقة متوسطة';
  } else {
    levelClass = 'bg-surface border-error text-error';
    label = 'ثقة منخفضة';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelClass}`}>
      <span>{label}</span>
      <span className="tabular-nums" dir="ltr">{score}%</span>
    </span>
  );
}

ConfidenceBadge.propTypes = {
  score: PropTypes.number
};
