import { Link } from "react-router-dom";
import DataRail from "./DataRail";
import StatusStamp from "./StatusStamp";
import { formatCurrency, formatDate } from "../functions/tenders";

/**
 * One tender in the browse grid.
 *
 * @param {object} tender
 * @param {React.ReactNode} [actions] owner/admin controls, decided by the page
 */
const TenderCard = ({ tender, actions }) => (
  <article className="flex flex-col rounded-card border border-border bg-surface p-4 sm:p-6">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <h3 className="font-display text-lg text-ink">
        <Link
          to={`/tenders/${tender._id}`}
          className="hover:text-registry-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
        >
          <bdi>{tender.title}</bdi>
        </Link>
      </h3>
      <StatusStamp entity="tender" status={tender.status} />
    </div>

    <p className="mb-4 line-clamp-2 text-sm leading-6 text-text-secondary">
      {tender.description}
    </p>

    <DataRail
      items={[
        { label: "الفئة", value: tender.category },
        {
          label: "الميزانية التقديرية",
          value: (
            <bdi className="tabular-nums">{formatCurrency(tender.budgetEstimate)}</bdi>
          ),
        },
        { label: "الموعد النهائي", value: formatDate(tender.deadline) },
        {
          label: "الجهة",
          value: <bdi>{tender.createdBy?.companyName ?? "—"}</bdi>,
        },
      ]}
    />

    {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
  </article>
);

export default TenderCard;
