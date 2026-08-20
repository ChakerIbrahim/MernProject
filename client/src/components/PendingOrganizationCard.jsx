import { useState } from "react";
import Button from "./Button";
import StatusStamp from "./StatusStamp";
import { fileUrl } from "../functions/api";

/**
 * One pending organization awaiting an admin decision (FR-4.1 … FR-4.3).
 *
 * Rejection is destructive, so it is flag-red and takes a confirm step with an
 * optional Arabic reason before it fires (NFR-U4).
 *
 * @param {object} organization
 * @param {(id: string) => void} onApprove
 * @param {(id: string, reason: string) => void} onReject
 * @param {boolean} [isBusy]
 */
const PendingOrganizationCard = ({ organization, onApprove, onReject, isBusy = false }) => {
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [reason, setReason] = useState("");

  const reasonId = `reject-reason-${organization._id}`;
  const submittedOn = new Date(organization.createdAt).toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleReject = () => {
    onReject(organization._id, reason.trim());
    setIsConfirmingReject(false);
  };

  return (
    <article className="rounded-card border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">
            <bdi>{organization.companyName}</bdi>
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            <bdi>{organization.name}</bdi>
          </p>
        </div>
        <StatusStamp entity="organization" status={organization.status} />
      </div>

      {/* Data rail — design.md §5 */}
      <dl className="mb-4 border-s-2 border-border ps-4 text-sm">
        <div className="mb-2 flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">رقم السجل التجاري:</dt>
          <dd className="text-ink">
            <bdi className="tabular-nums" dir="ltr">
              {organization.commercialRegisterNo}
            </bdi>
          </dd>
        </div>
        <div className="mb-2 flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">البريد الإلكتروني:</dt>
          <dd className="text-ink">
            <bdi dir="ltr">{organization.email}</bdi>
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">تاريخ التقديم:</dt>
          <dd className="text-ink">{submittedOn}</dd>
        </div>
      </dl>

      {organization.proofDocumentUrl ? (
        <p className="mb-4 text-sm">
          <a
            href={fileUrl(organization.proofDocumentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-registry-green underline underline-offset-4 hover:text-green-dark"
          >
            عرض وثيقة الإثبات
          </a>
        </p>
      ) : (
        <p className="mb-4 text-sm text-warning">لم تُرفق وثيقة إثبات.</p>
      )}

      {isConfirmingReject ? (
        <div className="rounded-field border border-error p-3">
          <p className="mb-3 text-sm text-ink">
            سيتم رفض طلب <bdi>{organization.companyName}</bdi>. هل تريد المتابعة؟
          </p>

          <label htmlFor={reasonId} className="mb-1 block text-sm text-ink">
            سبب الرفض (اختياري)
          </label>
          <textarea
            id={reasonId}
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mb-3 w-full rounded-field border border-border bg-surface px-3 py-2 text-sm text-ink text-start
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={handleReject} disabled={isBusy}>
              تأكيد الرفض
            </Button>
            <Button variant="secondary" onClick={() => setIsConfirmingReject(false)} disabled={isBusy}>
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onApprove(organization._id)} isLoading={isBusy}>
            قبول الطلب
          </Button>
          <Button variant="danger" onClick={() => setIsConfirmingReject(true)} disabled={isBusy}>
            رفض الطلب
          </Button>
        </div>
      )}
    </article>
  );
};

export default PendingOrganizationCard;
