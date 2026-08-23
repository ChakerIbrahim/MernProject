import Button from "./Button";
import ConfidenceMeter from "./ConfidenceMeter";
import FileField from "./FileField";
import FormField from "./FormField";
import Spinner from "./Spinner";
import { ACCEPT_ATTRIBUTE, FILE_HINT } from "../functions/uploads";
import { formatCurrency } from "../functions/tenders";

/**
 * The three-step submission flow (FR-10):
 *   upload → analysing → review, then confirm.
 *
 * The governing rule is FR-10.4 / NFR-R1: a failed AI call must never block
 * submission. The manual price field is present at every stage and the confirm
 * button stays enabled even when the analysis fails, so a Gemini outage costs
 * the user a convenience, never the ability to bid.
 *
 * @param {"form"|"analysing"|"review"} stage
 * @param {{finalPrice: string}} values
 * @param {(field: string, value: string) => void} onChange
 * @param {File|null} file
 * @param {(file: File|null) => void} onFileChange
 * @param {(event: object) => void} onSubmit   creates the proposal, then analyses
 * @param {() => void} onConfirm               commits the reviewed price
 * @param {object|null} [analysis]             { extractedPrice, summary, confidenceScore }
 * @param {boolean} [analysisFailed]
 * @param {object} [errors]
 * @param {string} [formError]
 * @param {boolean} [isBusy]
 * @param {number} [progress]
 */
const ProposalForm = ({
  stage,
  values,
  onChange,
  file,
  onFileChange,
  onSubmit,
  onConfirm,
  analysis = null,
  analysisFailed = false,
  errors = {},
  formError = "",
  isBusy = false,
  progress = 0,
}) => {
  if (stage === "analysing") {
    // NFR-P4/NFR-U3: analysis is exempt from the 2s rule, which makes visible
    // progress mandatory rather than optional.
    return (
      <div>
        <Spinner label="جاري تحليل المستند… قد تستغرق العملية بضع ثوانٍ." />
        <p className="text-center text-xs text-text-secondary">
          يمكنك إدخال السعر يدوياً إذا تعذّر التحليل.
        </p>
      </div>
    );
  }

  if (stage === "review") {
    return (
      <div>
        {analysisFailed ? (
          <p
            role="status"
            className="mb-4 rounded-field border border-warning bg-surface px-3 py-2 text-sm text-warning"
          >
            تعذّر تحليل المستند تلقائياً، يمكنك إدخال السعر يدوياً ومتابعة الإرسال.
          </p>
        ) : null}

        {analysis ? (
          <div className="mb-4 rounded-field border border-border p-3">
            <h3 className="mb-3 font-display text-base text-ink">نتيجة التحليل الآلي</h3>

            <dl className="mb-3 text-sm">
              <div className="mb-2 flex flex-wrap gap-x-2">
                <dt className="text-text-secondary">السعر المستخرج:</dt>
                <dd className="text-ink">
                  <bdi className="tabular-nums" dir="ltr">
                    {formatCurrency(analysis.extractedPrice)}
                  </bdi>
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-text-secondary">الملخص:</dt>
                <dd className="text-ink">{analysis.summary}</dd>
              </div>
            </dl>

            <ConfidenceMeter score={analysis.confidenceScore} />
          </div>
        ) : null}

        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
          >
            {formError}
          </p>
        ) : null}

        {/* FR-10.3 — pre-filled from the analysis, never locked. */}
        <FormField
          id="proposal-final-price"
          label="السعر النهائي"
          type="number"
          dir="ltr"
          value={values.finalPrice}
          onChange={(event) => onChange("finalPrice", event.target.value)}
          error={errors.finalPrice}
          hint="يمكنك تعديل السعر؛ القيمة المدخلة هنا هي المعتمدة."
          min="0"
          required
        />

        <Button onClick={onConfirm} isLoading={isBusy}>
          تأكيد العرض
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError ? (
        <p
          role="alert"
          className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
        >
          {formError}
        </p>
      ) : null}

      <FileField
        id="proposalDocument"
        label="مستند العرض"
        accept={ACCEPT_ATTRIBUTE}
        hint={FILE_HINT}
        fileName={file?.name}
        onChange={onFileChange}
        error={errors.proposalDocument || errors.documentUrl}
        disabled={isBusy}
        required
      />

      {isBusy && progress > 0 ? (
        <div className="mb-4">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="تقدّم رفع المستند"
            className="h-2 w-full overflow-hidden rounded-control border border-border bg-paper"
          >
            <div
              className="h-full bg-registry-green transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            جاري رفع المستند… <bdi className="tabular-nums">{progress}%</bdi>
          </p>
        </div>
      ) : null}

      <FormField
        id="proposal-final-price"
        label="السعر النهائي"
        type="number"
        dir="ltr"
        value={values.finalPrice}
        onChange={(event) => onChange("finalPrice", event.target.value)}
        error={errors.finalPrice}
        hint="سيُعرض عليك السعر المستخرج من المستند بعد التحليل، ويمكنك تعديله."
        min="0"
        required
      />

      <Button type="submit" isLoading={isBusy}>
        رفع المستند وتحليله
      </Button>
    </form>
  );
};

export default ProposalForm;
