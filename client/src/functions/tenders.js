/**
 * Mirrors the enum in server/models/tender.model.js. The schema is the
 * authority (NFR-M3); this copy exists only so the filter and the create form
 * offer the same choices. Keep the two lists in step.
 */
export const TENDER_CATEGORIES = [
  "إنشاءات",
  "تكنولوجيا المعلومات",
  "توريدات",
  "خدمات استشارية",
  "نقل ومواصلات",
  "صيانة",
  "أخرى",
];

/** Western digits with thousands separators, per the Arabic UI convention. */
export const formatCurrency = (value) =>
  typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : "—";

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("ar", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

/** Today as yyyy-mm-dd, for the date input's `min` courtesy bound. */
export const todayForInput = () => new Date().toISOString().slice(0, 10);

/** A date input needs yyyy-mm-dd; the API returns an ISO timestamp. */
export const toDateInputValue = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";
