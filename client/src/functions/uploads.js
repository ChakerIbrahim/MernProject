/**
 * Courtesy pre-checks for the file picker, mirroring C-9 so the user hears
 * about an obvious problem before a 5MB upload crosses the wire.
 *
 * These are advisory only. The server re-checks the declared type, the size,
 * and the file's actual magic bytes, and is the authority (NFR-S7, NFR-S8).
 */
export const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.pdf";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const FILE_HINT = "الملفات المسموح بها: JPG أو PNG أو PDF، بحد أقصى 5 ميغابايت.";

/** @returns {string} an Arabic problem description, or "" when the file looks fine */
export const describeFileProblem = (file) => {
  if (!file) return "وثيقة الإثبات مطلوبة.";
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "نوع الملف غير مدعوم. الملفات المسموح بها: JPG أو PNG أو PDF.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "حجم الملف يتجاوز الحد المسموح به (5 ميغابايت).";
  }
  return "";
};
