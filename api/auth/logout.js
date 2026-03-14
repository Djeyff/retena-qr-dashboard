const { COOKIE_NAME } = require('./_jwt');

module.exports = async function handler(req, res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? '; Secure' : ''}`);
  res.json({ ok: true });
};
