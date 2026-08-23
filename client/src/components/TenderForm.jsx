import Button from "./Button";
import FormField from "./FormField";
import { TENDER_CATEGORIES, todayForInput } from "../functions/tenders";

/**
 * Shared create/edit form. The page owns the values and the submit; this
 * renders fields and surfaces the server's per-field error map (AGENTS.md).
 *
 * @param {object} values      { title, description, category, budgetEstimate, deadline }
 * @param {(field: string, value: string) => void} onChange
 * @param {(event: object) => void} onSubmit
 * @param {object} [errors]    per-field Arabic messages from the API
 * @param {string} [formError] one form-level Arabic sentence
 * @param {boolean} [isSubmitting]
 * @param {string} [submitLabel]
 * @param {React.ReactNode} [secondaryAction]
 */
const TenderForm = ({
  values,
  onChange,
  onSubmit,
  errors = {},
  formError = "",
  isSubmitting = false,
  submitLabel = "حفظ",
  secondaryAction,
}) => {
  const handle = (field) => (event) => onChange(field, event.target.value);

  const controlClasses =
    "w-full rounded-field border bg-surface px-3 py-2 text-ink text-start " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-card border border-border bg-surface p-4 sm:p-6"
    >
      {formError ? (
        <p
          role="alert"
          className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
        >
          {formError}
        </p>
      ) : null}

      <FormField
        id="tender-title"
        label="عنوان العطاء"
        value={values.title}
        onChange={handle("title")}
        error={errors.title}
        required
      />

      <div className="mb-4">
        <label htmlFor="tender-description" className="mb-1 block text-sm text-ink">
          وصف العطاء
          <span aria-hidden="true" className="text-error">
            {" *"}
          </span>
        </label>
        <textarea
          id="tender-description"
          rows={5}
          value={values.description}
          onChange={handle("description")}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "tender-description-error" : undefined}
          className={`${controlClasses} ${errors.description ? "border-error" : "border-border"}`}
        />
        {errors.description ? (
          <p id="tender-description-error" role="alert" className="mt-1 text-sm text-error">
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="mb-4">
        <label htmlFor="tender-category" className="mb-1 block text-sm text-ink">
          الفئة
          <span aria-hidden="true" className="text-error">
            {" *"}
          </span>
        </label>
        <select
          id="tender-category"
          value={values.category}
          onChange={handle("category")}
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? "tender-category-error" : undefined}
          className={`${controlClasses} ${errors.category ? "border-error" : "border-border"}`}
        >
          <option value="">اختر فئة</option>
          {TENDER_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category ? (
          <p id="tender-category-error" role="alert" className="mt-1 text-sm text-error">
            {errors.category}
          </p>
        ) : null}
      </div>

      <FormField
        id="tender-budget"
        label="الميزانية التقديرية"
        type="number"
        dir="ltr"
        value={values.budgetEstimate}
        onChange={handle("budgetEstimate")}
        error={errors.budgetEstimate}
        hint="اختياري."
      />

      <FormField
        id="tender-deadline"
        label="الموعد النهائي"
        type="date"
        dir="ltr"
        value={values.deadline}
        onChange={handle("deadline")}
        error={errors.deadline}
        hint="يجب أن يكون تاريخاً في المستقبل."
        min={todayForInput()}
        required
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  );
};

export default TenderForm;
