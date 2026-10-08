import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import dotenv from 'dotenv';

dotenv.config();

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = 'global_league_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
let secretLocal;

const obtenerSecreto = () => {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar AUTH_SECRET para iniciar la autenticación.');
  }
  if (!secretLocal) {
    secretLocal = randomBytes(32).toString('hex');
    console.warn('AUTH_SECRET no configurado: las sesiones locales vencerán al reiniciar el backend.');
  }
  return secretLocal;
};

export const assertAuthConfiguration = () => {
  obtenerSecreto();
};

export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password, encodedHash) => {
  const [algorithm, salt, storedHex] = String(encodedHash || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f\d]{128}$/i.test(storedHex || '')) return false;

  const storedKey = Buffer.from(storedHex, 'hex');
  const derivedKey = await scryptAsync(password, salt, storedKey.length);
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
};

export const createSessionToken = (idUsuario) => {
  const ahora = Math.floor(Date.now() / 1000);
  const contenido = Buffer.from(JSON.stringify({
    sub: Number(idUsuario),
    iat: ahora,
    exp: ahora + SESSION_SECONDS,
    nonce: randomBytes(12).toString('hex'),
  })).toString('base64url');
  const firma = createHmac('sha256', obtenerSecreto()).update(contenido).digest('base64url');
  return `${contenido}.${firma}`;
};

export const verifySessionToken = (token) => {
  if (typeof token !== 'string') return null;
  const [contenido, firma, extra] = token.split('.');
  if (!contenido || !firma || extra) return null;

  const firmaEsperada = createHmac('sha256', obtenerSecreto()).update(contenido).digest();
  let firmaRecibida;
  try {
    firmaRecibida = Buffer.from(firma, 'base64url');
  } catch {
    return null;
  }
  if (firmaRecibida.length !== firmaEsperada.length || !timingSafeEqual(firmaRecibida, firmaEsperada)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(contenido, 'base64url').toString('utf8'));
    if (!Number.isInteger(payload.sub) || payload.sub <= 0 || !Number.isInteger(payload.exp)) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { idUsuario: payload.sub };
  } catch {
    return null;
  }
};

export const getSessionCookie = (req) => {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
  } catch {
    return null;
  }
};

export const setSessionCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`);
};

export const clearSessionCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`);
};
