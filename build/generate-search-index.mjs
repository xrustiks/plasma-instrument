import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CLIENT_ROOT = path.join(PROJECT_ROOT, 'client');
const OUT_FILE = path.join(CLIENT_ROOT, 'search-index.json');
const ARTICLES_FILE = path.join(PROJECT_ROOT, 'server', 'storage', 'data', 'articles.json');

const SECTION_ORDER = ['sources', 'services', 'projects', 'blog', 'contacts'];
const SECTION_LABELS = {
  ru: {
    sources: 'Технологические источники',
    services: 'Услуги',
    projects: 'Инвестиционные и научные проекты',
    blog: 'Блог',
    contacts: 'Контакты',
  },
  en: {
    sources: 'Technological sources',
    services: 'Services',
    projects: 'Investment and scientific projects',
    blog: 'Blog',
    contacts: 'Contacts',
  },
};

function stripTags(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleUrl(section, slug) {
  return `sections/${section}/${slug}/index.html`;
}

function normalizeSection(section) {
  if (section === 'sources' || section === 'services' || section === 'projects' || section === 'blog') {
    return section;
  }

  return '';
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return '';
  return stripTags(titleMatch[1]);
}

function extractBody(html) {
  const mainMatch = html.match(/<main\b[\s\S]*?<\/main>/i);
  const source = mainMatch ? mainMatch[0] : html;
  return stripTags(source);
}

async function readArticles() {
  const raw = await fs.readFile(ARTICLES_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function readStaticContactEntry(lang) {
  const filePath = lang === 'en'
    ? path.join(CLIENT_ROOT, 'en', 'sections', 'contacts', 'index.html')
    : path.join(CLIENT_ROOT, 'sections', 'contacts', 'index.html');

  const html = await fs.readFile(filePath, 'utf8');
  const title = extractTitle(html) || SECTION_LABELS[lang].contacts;
  const body = extractBody(html);

  return {
    section: 'contacts',
    url: 'sections/contacts/index.html',
    title,
    body
  };
}

function createCmsEntry(article, lang) {
  const title = lang === 'en'
    ? (article.titleEn || article.titleRu || '')
    : (article.titleRu || article.titleEn || '');

  const content = lang === 'en'
    ? (article.contentEn || article.contentRu || '')
    : (article.contentRu || article.contentEn || '');

  if (!title) {
    return null;
  }

  return {
    section: article.section,
    url: articleUrl(article.section, article.slug),
    title,
    body: stripTags(content)
  };
}

export async function generateSearchIndex() {
  const articles = await readArticles();
  const data = {
    generatedAt: new Date().toISOString(),
    ru: { sections: [], entries: [] },
    en: { sections: [], entries: [] },
  };

  data.ru.sections = SECTION_ORDER.map((key) => ({ key, label: SECTION_LABELS.ru[key] }));
  data.en.sections = SECTION_ORDER.map((key) => ({ key, label: SECTION_LABELS.en[key] }));

  for (const article of articles) {
    const section = normalizeSection(article?.section);
    if (!section || !article?.slug) {
      continue;
    }

    const normalized = {
      ...article,
      section
    };

    const ruEntry = createCmsEntry(normalized, 'ru');
    const enEntry = createCmsEntry(normalized, 'en');

    if (ruEntry) {
      data.ru.entries.push(ruEntry);
    }

    if (enEntry) {
      data.en.entries.push(enEntry);
    }
  }

  data.ru.entries.push(await readStaticContactEntry('ru'));
  data.en.entries.push(await readStaticContactEntry('en'));

  data.ru.entries.sort((left, right) => left.url.localeCompare(right.url, 'ru'));
  data.en.entries.sort((left, right) => left.url.localeCompare(right.url, 'en'));

  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Generated ${path.basename(OUT_FILE)}: ru=${data.ru.entries.length}, en=${data.en.entries.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateSearchIndex().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}