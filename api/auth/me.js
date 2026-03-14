const { verify, parseCookies, COOKIE_NAME } = require('./_jwt');

module.exports = async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = verify(token);
    return res.json({ email: payload.email, app: payload.app });
  } catch (e) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? '; Secure' : ''}`);
    return res.status(401).json({ error: 'Session expired' });
  }
};
