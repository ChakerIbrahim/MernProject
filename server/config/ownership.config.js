/**
 * Ownership authorization, applied after isAuth and isRole.
 *
 * A factory so Sprints 04 and 05 can reuse it for proposals without
 * reimplementing the comparison. The loaded document is attached to
 * `req.resource` so the controller does not read it a second time.
 *
 * @param {import("mongoose").Model} Model
 * @param {object}  [options]
 * @param {boolean} [options.allowAdmin=true] whether an admin may act on
 *   someone else's document. False for edits: FR-8.1 gives editing to the
 *   owning organization only, while FR-8.3 gives an admin the power to close
 *   or cancel anything.
 * @param {string}  [options.ownerField="createdBy"]
 * @param {string}  [options.idParam="id"]
 */
const isOwnerOrAdmin =
  (Model, { allowAdmin = true, ownerField = "createdBy", idParam = "id" } = {}) =>
  async (req, res, next) => {
    try {
      // A malformed id throws CastError, which the global middleware turns
      // into 404 rather than 500 (API-5).
      const document = await Model.findById(req.params[idParam]);

      if (!document) {
        const err = new Error("العنصر المطلوب غير موجود.");
        err.status = 404;
        err.expose = true;
        return next(err);
      }

      const isAdmin = req.user.role === "admin";
      const isOwner = String(document[ownerField]) === String(req.user._id);

      if (!isOwner && !(allowAdmin && isAdmin)) {
        const err = new Error("forbidden");
        err.status = 403;
        return next(err);
      }

      req.resource = document;
      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = { isOwnerOrAdmin };
