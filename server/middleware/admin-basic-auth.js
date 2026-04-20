import crypto from 'crypto';
import {
  ADMIN_BASIC_AUTH_PASSWORD,
  ADMIN_BASIC_AUTH_USERNAME
} from '../config/constants.js';

// Содержит имя cookie, используемого для хранения сессии администратора
const ADMIN_SESSION_COOKIE = 'pi_admin_session';
const ADMIN_CSRF_COOKIE = 'pi_admin_csrf';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SECONDS * 1000;
const adminSessions = new Map();

// Возвращает 503, если базовая аутентификация не настроена на сервере
function authNotConfigured(req, res) {
  const message = 'Admin authentication is not configured on the server';
  const acceptsJson = String(req.headers.accept || '').includes('application/json');
  const isApiRequest = String(req.originalUrl || '').startsWith('/api/');

  if (acceptsJson || isApiRequest) {
    return res.status(503).json({ error: message });
  }

  return res.status(503).send(message);
}

// Возвращает 401, если пользователь предоставил неверные данные
function unauthorized(req, res) {
  const message = 'Authentication required';
  const acceptsJson = String(req.headers.accept || '').includes('application/json');
  const isApiRequest = String(req.originalUrl || '').startsWith('/api/');

  if (acceptsJson || isApiRequest) {
    return res.status(401).json({ error: message });
  }

  return res.status(401).send(message);
}

// Возвращает объект { username, password }, если заголовок авторизации содержит допустимые данные
function parseBasicAuthHeader(header) {
  if (!header || !header.startsWith('Basic ')) {
    return null;
  }

  const encoded = header.slice(6).trim();

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
}

// Возвращает true, если в запросе есть действительная сессия администратора
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex < 0) return acc;

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function createRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function toCookieList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [String(value)];
}

function appendSetCookieHeader(res, cookiesToAdd) {
  const existing = toCookieList(res.getHeader('Set-Cookie'));
  res.setHeader('Set-Cookie', [...existing, ...cookiesToAdd]);
}

function safeTokenEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionToken() {
  return createRandomToken();
}

function createSessionCsrfToken() {
  return createRandomToken();
}

function getSecureCookiePart() {
  return process.env.NODE_ENV === 'production' ? '; Secure' : '';
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionToken = cookies[ADMIN_SESSION_COOKIE];

  if (!sessionToken) {
    return null;
  }

  const session = adminSessions.get(sessionToken);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(sessionToken);
    return null;
  }

  return {
    ...session,
    sessionToken
  };
}

function readRequestCsrfToken(req) {
  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }

  const bodyToken = req.body && typeof req.body._csrf === 'string'
    ? req.body._csrf.trim()
    : '';

  return bodyToken;
}

// Проверяет, что базовая аутентификация настроена, 
// и что предоставленные учетные данные действительны
export function isAdminAuthConfigured() {
  return Boolean(ADMIN_BASIC_AUTH_USERNAME && ADMIN_BASIC_AUTH_PASSWORD);
}

// Проверяет, что предоставленные имя пользователя и пароль 
// совпадают с настройками сервера
export function isValidAdminCredentials(username, password) {
  return username === ADMIN_BASIC_AUTH_USERNAME && password === ADMIN_BASIC_AUTH_PASSWORD;
}

// Устанавливает cookie сессии администратора, 
// используя токен, созданный на основе учетных данных
export function setAdminSessionCookie(res) {
  const token = createSessionToken();
  const csrfToken = createSessionCsrfToken();
  const securePart = getSecureCookiePart();
  const maxAgePart = `; Max-Age=${ADMIN_SESSION_TTL_SECONDS}`;

  adminSessions.set(token, {
    csrfToken,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS
  });

  appendSetCookieHeader(res, [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${maxAgePart}${securePart}`,
    `${ADMIN_CSRF_COOKIE}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax${maxAgePart}${securePart}`
  ]);
}

// Очищает cookie сессии администратора, устанавливая его с истекшим временем жизни
export function clearAdminSessionCookie(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionToken = cookies[ADMIN_SESSION_COOKIE];

  if (sessionToken) {
    adminSessions.delete(sessionToken);
  }

  appendSetCookieHeader(res, [
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${ADMIN_CSRF_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`
  ]);
}

// Возвращает true, если в запросе есть действительная сессия администратора
function hasValidAdminSession(req) {
  return Boolean(getSessionFromRequest(req));
}

// Обеспечивает наличие CSRF cookie для формы входа
export function ensureAdminCsrfCookie(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[ADMIN_CSRF_COOKIE];

  if (typeof token === 'string' && token.trim()) {
    return token;
  }

  const csrfToken = createRandomToken();
  const securePart = getSecureCookiePart();
  const maxAgePart = `; Max-Age=${ADMIN_SESSION_TTL_SECONDS}`;
  appendSetCookieHeader(res, [
    `${ADMIN_CSRF_COOKIE}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax${maxAgePart}${securePart}`
  ]);

  return csrfToken;
}

// Проверяет CSRF токен для формы логина
export function verifyAdminLoginCsrf(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const csrfCookie = cookies[ADMIN_CSRF_COOKIE];
  const csrfToken = readRequestCsrfToken(req);

  if (!csrfCookie || !csrfToken) {
    return false;
  }

  return safeTokenEqual(csrfCookie, csrfToken);
}

// Проверяет CSRF токен для state-changing запросов с cookie-сессией
export function requireAdminCsrf(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    // Для Basic Auth без cookie CSRF не требуется.
    return next();
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const csrfCookie = cookies[ADMIN_CSRF_COOKIE];
  const csrfToken = readRequestCsrfToken(req);

  if (!csrfCookie || !csrfToken) {
    return res.status(403).json({ error: 'CSRF token is missing' });
  }

  if (!safeTokenEqual(session.csrfToken, csrfToken) || !safeTokenEqual(csrfCookie, csrfToken)) {
    return res.status(403).json({ error: 'CSRF token is invalid' });
  }

  return next();
}

// Возвращает middleware, который требует наличия действительной сессии администратора,
// или действительных учетных данных базовой аутентификации в заголовке Authorization
export function requireAdminAuth(req, res, next) {
  if (!isAdminAuthConfigured()) {
    return authNotConfigured(req, res);
  }

  if (hasValidAdminSession(req)) {
    return next();
  }

  const credentials = parseBasicAuthHeader(req.headers.authorization);

  if (
    !credentials ||
    !isValidAdminCredentials(credentials.username, credentials.password)
  ) {
    return unauthorized(req, res);
  }

  return next();
}

// Возвращает middleware для защиты страниц админ-панели
export function requireAdminPageAuth(req, res, next) {
  if (!isAdminAuthConfigured()) {
    return authNotConfigured(req, res);
  }

  // Allow login page and its static assets before authentication.
  if (
    req.path === '/login.html' ||
    req.path === '/login' ||
    req.path === '/login.css'
  ) {
    return next();
  }

  if (hasValidAdminSession(req)) {
    return next();
  }

  // Если пользователь не авторизован, 
  // перенаправляем его на страницу входа с параметром next
  const nextPath = encodeURIComponent(req.originalUrl || '/admin/');
  return res.redirect(`/admin/login.html?next=${nextPath}`);
}