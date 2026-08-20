/** Where each role lands after login (SRS §4.1). */
export const dashboardPathFor = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "organization") return "/org/dashboard";
  return "/dashboard";
};

/**
 * FR-6.3 — only an approved organization may create a tender. Used by the
 * client to hide the entry point; the server enforces it independently.
 */
export const isApprovedOrganization = (user) =>
  user?.role === "organization" && user?.status === "approved";
