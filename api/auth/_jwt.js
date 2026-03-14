// Shared JWT utilities — no external deps, uses Node crypto
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'retena-dev-secret-change-in-prod';
const EXPIRY_DAYS = 7;

function sign(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + EXPIRY_DAYS * 86400;
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verify(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed');
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) out[k.trim()] = decodeURIComponent(v.join('='));
  });
  return out;
}

const COOKIE_NAME = 'retena_auth';
const COOKIE_FLAGS = (prod) =>
  `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax${prod ? '; Secure' : ''}`;

module.exports = { sign, verify, parseCookies, COOKIE_NAME, EXPIRY_DAYS };
