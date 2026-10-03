function isAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "دسترسی فقط برای ادمین" });
  }
  next();
}

module.exports = { isAdmin };
