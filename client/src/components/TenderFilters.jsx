import Button from "./Button";
import { TENDER_CATEGORIES } from "../functions/tenders";

/**
 * Category and budget-range filter bar (FR-7.2).
 *
 * Values come from the page's URL query params, so a filtered view is
 * shareable and survives a refresh. This component only reports changes.
 *
 * @param {{category: string, minBudget: string, maxBudget: string}} values
 * @param {(next: object) => void} onChange
 * @param {() => void} onReset
 * @param {boolean} [hasFilters]
 */
const TenderFilters = ({ values, onChange, onReset, hasFilters = false }) => {
  const set = (field) => (event) => onChange({ [field]: event.target.value });

  const inputClasses =
    "w-full rounded-field border border-border bg-surface px-3 py-2 text-sm text-ink text-start " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green";

  return (
    <section
      aria-label="تصفية العطاءات"
      className="mb-6 rounded-card border border-border bg-surface p-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-sm text-ink">
            الفئة
          </label>
          <select
            id="filter-category"
            value={values.category}
            onChange={set("category")}
            className={inputClasses}
          >
            <option value="">كل الفئات</option>
            {TENDER_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-min" className="mb-1 block text-sm text-ink">
            أقل ميزانية
          </label>
          <input
            id="filter-min"
            type="number"
            min="0"
            inputMode="numeric"
            dir="ltr"
            value={values.minBudget}
            onChange={set("minBudget")}
            className={`${inputClasses} tabular-nums`}
          />
        </div>

        <div>
          <label htmlFor="filter-max" className="mb-1 block text-sm text-ink">
            أعلى ميزانية
          </label>
          <input
            id="filter-max"
            type="number"
            min="0"
            inputMode="numeric"
            dir="ltr"
            value={values.maxBudget}
            onChange={set("maxBudget")}
            className={`${inputClasses} tabular-nums`}
          />
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={onReset}>
            إزالة التصفية
          </Button>
        </div>
      ) : null}
    </section>
  );
};

export default TenderFilters;
