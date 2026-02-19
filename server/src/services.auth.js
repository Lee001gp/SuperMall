/**
 * Authentication service using scrypt password hashing and signed tokens.
 */
import crypto from 'crypto';
import { config } from './config.js';

const TOKEN_TTL_SEC = 900;
const REFRESH_TTL_DAYS = 14;

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function createId() {
  return crypto.randomUUID();
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => (err ? reject(err) : resolve(derived)));
  });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const [salt, digest] = encoded.split(':');
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => (err ? reject(err) : resolve(derived)));
  });
  return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(key));
}

export function signAccessToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  const signature = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyAccessToken(token) {
  const [header, body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url');
  if (expected !== signature) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

export function createRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashOpaqueToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
