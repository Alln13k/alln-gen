const config = require('../config');

module.exports = (req, res) => {
  res.setHeader('Set-Cookie', `${config.COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
  res.writeHead(302, { Location: '/generateur.html' });
  res.end();
};