/**
 * GET /api/users/me — protected by isAuth. The client calls this on mount to
 * restore a session after a page reload (SRS §4.2, 200 { user }).
 *
 * req.user is the database record attached by isAuth, and the schema's toJSON
 * transform strips the password hash on serialisation (NFR-S2).
 */
const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { getMe };
