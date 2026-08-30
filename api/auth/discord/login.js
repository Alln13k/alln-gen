const crypto = require('crypto');
const config = require('../../config');

module.exports = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax; Secure`);
  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    redirect_uri: config.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state: state
  });
  res.writeHead(302, { Location: `https://discord.com/api/oauth2/authorize?${params.toString()}` });
  res.end();
};