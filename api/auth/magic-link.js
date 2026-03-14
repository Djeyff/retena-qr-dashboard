const { sign, COOKIE_NAME, EXPIRY_DAYS } = require('./_jwt');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let email;
  try {
    email = (req.body?.email || '').trim().toLowerCase();
  } catch (_) {
    return res.status(400).json({ error: 'Bad request' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const token = sign({ email, app: 'retena' });
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${EXPIRY_DAYS * 86400}; SameSite=Lax${secure}`
  );

  // Phase 1 — dev mode: set cookie and redirect immediately.
  // Phase 2: send real magic link email, return { sent: true } instead.
  const IS_DEV = process.env.MAGIC_LINK_DEV !== 'false';
  if (IS_DEV) {
    return res.json({ redirect: '/dashboard/' });
  }

  // Phase 2 placeholder: send email here
  return res.json({ sent: true, message: 'Check your email — click the link to log in.' });
};
