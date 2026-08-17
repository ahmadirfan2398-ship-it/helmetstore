// Simple session-based flash message system (for toast notifications)
function flashMiddleware(req, res, next) {
  if (!req.session) return next();

  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  // Helper to set a flash message that will show as a toast on next page load
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };

  next();
}

module.exports = flashMiddleware;
