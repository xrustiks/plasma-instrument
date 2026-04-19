const DEFAULT_PORT = 3000;
const parsedPort = Number.parseInt(process.env.PORT || '', 10);

export const PORT = Number.isInteger(parsedPort) && parsedPort > 0
  ? parsedPort
  : DEFAULT_PORT;
export const API_PREFIX = '/api';

export const SECTIONS = [
  { id: 'sources', labelRu: 'Источники', labelEn: 'Sources' },
  { id: 'services', labelRu: 'Услуги', labelEn: 'Services' },
  { id: 'projects', labelRu: 'Проекты', labelEn: 'Projects' },
  { id: 'blog', labelRu: 'Блог', labelEn: 'Blog' }
];
