const config = require('../config');
const crypto = require('crypto');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      cookies[name] = rest.join('=');
    });
  }
  return cookies;
}

function verifySession(token, secret) {
  const [payloadBase64, signature] = token.split('.');
  const payloadStr = Buffer.from(payloadBase64, 'base64').toString();
  const expected = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  if (signature !== expected) throw new Error('Invalid signature');
  return JSON.parse(payloadStr);
}

module.exports = (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[config.COOKIE_NAME];
  if (!token) {
    res.statusCode = 401;
    res.json({ error: 'Not authenticated' });
    return;
  }
  try {
    const user = verifySession(token, config.SESSION_SECRET);
    res.json({ user });
  } catch (e) {
    res.statusCode = 401;
    res.json({ error: 'Invalid session' });
  }
};