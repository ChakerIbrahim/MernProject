// One component, four label sets (design.md §5): organization approval,
// tender status, proposal status, auction status. Status is never colour
// alone — every stamp carries an Arabic label and an icon.
const STATUS_MAP = {
  organization: {
    pending: { label: "قيد المراجعة", tone: "warning" },
    approved: { label: "مقبول", tone: "success" },
    rejected: { label: "مرفوض", tone: "error" },
  },
  tender: {
    open: { label: "مفتوح", tone: "success" },
    closed: { label: "مغلق", tone: "neutral" },
    cancelled: { label: "ملغى", tone: "error" },
  },
  proposal: {
    submitted: { label: "مُقدَّم", tone: "neutral" },
    under_review: { label: "قيد المراجعة", tone: "warning" },
    accepted: { label: "مقبول", tone: "success" },
    rejected: { label: "مرفوض", tone: "error" },
  },
  auction: {
    pending_approval: { label: "قيد الموافقة", tone: "warning" },
    active: { label: "نشط", tone: "success" },
    ended: { label: "منتهي", tone: "neutral" },
    cancelled: { label: "ملغى", tone: "error" },
  },
};

const UNKNOWN = { label: "غير محدد", tone: "neutral" };

const TONE_CLASSES = {
  success: "border-registry-green text-registry-green",
  warning: "border-warning text-warning",
  error: "border-error text-error",
  neutral: "border-border text-text-secondary",
};

// Non-directional glyphs only — nothing here flips under RTL.
const TONE_ICONS = {
  success: "M20 6 9 17l-5-5",
  warning: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  error: "M18 6 6 18M6 6l12 12",
  neutral: "M5 12h14",
};

/**
 * @param {"organization"|"tender"|"proposal"|"auction"} entity
 * @param {string} status raw status value as stored on the document
 */
const StatusStamp = ({ entity, status }) => {
  const { label, tone } = STATUS_MAP[entity]?.[status] ?? UNKNOWN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border bg-surface px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 shrink-0"
      >
        <path d={TONE_ICONS[tone]} />
      </svg>
      {label}
    </span>
  );
};

export default StatusStamp;
