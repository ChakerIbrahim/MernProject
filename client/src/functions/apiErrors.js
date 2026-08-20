/**
 * Reads what the API actually returned into something a form can render.
 *
 * The server owns validation (NFR-S7): components display its per-field map,
 * they never re-implement the rules. A raw exception or status code is never
 * shown to a user (NFR-U), so every path ends in a written Arabic sentence.
 */
const FALLBACK_MESSAGE = "تعذّر إتمام العملية. تأكد من اتصالك ثم حاول مرة أخرى.";

/** The per-field map from a 400 (API-3). Empty object when there isn't one. */
export const readFieldErrors = (error) => {
  const errors = error?.response?.data?.errors;
  return errors && typeof errors === "object" ? errors : {};
};

/** The single form-level sentence: { error } from login, { message } elsewhere. */
export const readFormError = (error) => {
  const data = error?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;
  if (data?.errors && typeof data.errors === "object") {
    return "يرجى تصحيح الحقول المميّزة بالأسفل.";
  }

  return FALLBACK_MESSAGE;
};
