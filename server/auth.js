// server/auth.js
const { SignJWT, jwtVerify } = require('jose');
const bcrypt = require('bcrypt');

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Token gerekli' } });
  verifyToken(header.slice(7))
    .then(payload => { req.admin = payload; next(); })
    .catch(() => res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Gecersiz token' } }));
}

async function hashPassword(pw) { return bcrypt.hash(pw, 12); }
async function comparePassword(pw, hash) { return bcrypt.compare(pw, hash); }

module.exports = { signToken, verifyToken, authMiddleware, hashPassword, comparePassword };
