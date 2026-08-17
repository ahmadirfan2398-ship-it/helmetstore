// Simple self-hosted math CAPTCHA (no external service needed)
function captchaMiddleware(req, res, next) {
  req.generateCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    req.session.captchaAnswer = a + b;
    return { a, b };
  };

  req.verifyCaptcha = (userAnswer) => {
    const expected = req.session.captchaAnswer;
    delete req.session.captchaAnswer;
    return expected !== undefined && parseInt(userAnswer) === expected;
  };

  next();
}

module.exports = captchaMiddleware;
