import crypto from 'crypto';
import {
  ADMIN_BASIC_AUTH_PASSWORD,
  ADMIN_BASIC_AUTH_USERNAME
} from '../config/constants.js';

// Содержит имя cookie, используемого для хранения сессии администратора
const ADMIN_SESSION_COOKIE = 'pi_admin_session';

// Возвращает 503, если базовая аутентификация не настроена на сервере
function authNotConfigured(res) {
  return res.status(503).send('Admin authentication is not configured on the server');
}

// Возвращает 401, если пользователь предоставил неверные данные
function unauthorized(res) {
  return res.status(401).send('Authentication required');
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

// Создает токен сессии на основе хэша имени пользователя и пароля администратора
function createSessionToken() {
  return crypto
    .createHash('sha256')
    .update(`${ADMIN_BASIC_AUTH_USERNAME}:${ADMIN_BASIC_AUTH_PASSWORD}`)
    .digest('hex');
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
  const isSecure = process.env.NODE_ENV === 'production';
  const securePart = isSecure ? '; Secure' : '';

  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${securePart}`
  );
}

// Очищает cookie сессии администратора, устанавливая его с истекшим временем жизни
export function clearAdminSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

// Возвращает true, если в запросе есть действительная сессия администратора
function hasValidAdminSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[ADMIN_SESSION_COOKIE];

  if (!token) {
    return false;
  }

  return token === createSessionToken();
}

// Возвращает middleware, который требует наличия действительной сессии администратора,
// или действительных учетных данных базовой аутентификации в заголовке Authorization
export function requireAdminAuth(req, res, next) {
  if (!isAdminAuthConfigured()) {
    return authNotConfigured(res);
  }

  if (hasValidAdminSession(req)) {
    return next();
  }

  const credentials = parseBasicAuthHeader(req.headers.authorization);

  if (
    !credentials ||
    !isValidAdminCredentials(credentials.username, credentials.password)
  ) {
    return unauthorized(res);
  }

  return next();
}

// Возвращает middleware для защиты страниц админ-панели
export function requireAdminPageAuth(req, res, next) {
  if (!isAdminAuthConfigured()) {
    return authNotConfigured(res);
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