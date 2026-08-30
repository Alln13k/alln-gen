const config = require('../../config');
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

function signSession(payload, secret) {
  const payloadStr = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  return `${Buffer.from(payloadStr).toString('base64')}.${signature}`;
}

module.exports = async (req, res) => {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    res.statusCode = 403;
    res.end('Invalid state');
    return;
  }

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.DISCORD_REDIRECT_URI
    })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    res.statusCode = 400;
    res.end('Token exchange failed');
    return;
  }

  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const userData = await userResponse.json();
  if (!userData.id) {
    res.statusCode = 400;
    res.end('User fetch failed');
    return;
  }

  const sessionPayload = {
    id: userData.id,
    username: userData.username,
    global_name: userData.global_name,
    avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null
  };
  const sessionToken = signSession(sessionPayload, config.SESSION_SECRET);
  res.setHeader('Set-Cookie', `${config.COOKIE_NAME}=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
  res.writeHead(302, { Location: '/generateur.html' });
  res.end();
};