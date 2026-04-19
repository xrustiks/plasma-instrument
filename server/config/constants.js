// Configuration constants for the API server, 
// including port number, API prefix, CORS allowed origins, and article sections
const DEFAULT_PORT = 3000;
const parsedPort = Number.parseInt(process.env.PORT || '', 10);

// Port number for the API server, defaulting to 3000 if not set or invalid
export const PORT = Number.isInteger(parsedPort) && parsedPort > 0
  ? parsedPort
  : DEFAULT_PORT;
export const API_PREFIX = '/api';

// CORS defaults for local development and primary production domains.
// You can override this list with CORS_ORIGINS env variable.
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://plasma-instrument.com',
  'https://www.plasma-instrument.com'
];

// Parses CORS origins from environment variable, falling back to defaults if not set
const parsedCorsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

// Assigns the final list of allowed CORS origins, using parsed values or defaults
export const CORS_ALLOWED_ORIGINS = parsedCorsOrigins.length
  ? parsedCorsOrigins
  : DEFAULT_CORS_ORIGINS;

// Sections configuration for articles, including IDs and labels in Russian and English
export const SECTIONS = [
  { id: 'sources', labelRu: 'Источники', labelEn: 'Sources' },
  { id: 'services', labelRu: 'Услуги', labelEn: 'Services' },
  { id: 'projects', labelRu: 'Проекты', labelEn: 'Projects' },
  { id: 'blog', labelRu: 'Блог', labelEn: 'Blog' }
];
