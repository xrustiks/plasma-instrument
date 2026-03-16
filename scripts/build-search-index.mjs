import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'search-index.json');

const SECTION_ORDER = ['istos', 'services', 'invprojects', 'blog', 'contacts'];
const SECTION_LABELS = {
  ru: {
    istos: 'Технологические источники',
    services: 'Услуги',
    invprojects: 'Инвестиционные и научные проекты',
    blog: 'Блог',
    contacts: 'Контакты',
  },
  en: {
    istos: 'Technological sources',
    services: 'Services',
    invprojects: 'Investment and scientific projects',
    blog: 'Blog',
    contacts: 'Contacts',
  },
};

const SKIP_DIRS = new Set(['.git', '.vscode', 'images', 'scripts', 'node_modules', 'memories']);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function sectionFromLocal(localPath) {
  if (localPath.startsWith('istos/')) return 'istos';
  if (localPath.startsWith('services/')) return 'services';
  if (localPath.startsWith('invprojects/')) return 'invprojects';
  if (localPath.startsWith('blog/')) return 'blog';
  if (localPath.startsWith('contacts/')) return 'contacts';
  return '';
}

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

async function walk(dirPath) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const item of items) {
    const absolute = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      if (SKIP_DIRS.has(item.name)) {
        continue;
      }
      files.push(...await walk(absolute));
      continue;
    }

    if (item.isFile() && item.name === 'index.html') {
      files.push(absolute);
    }
  }

  return files;
}

async function main() {
  const files = await walk(ROOT);
  const data = {
    generatedAt: new Date().toISOString(),
    ru: { sections: [], entries: [] },
    en: { sections: [], entries: [] },
  };

  data.ru.sections = SECTION_ORDER.map((key) => ({ key, label: SECTION_LABELS.ru[key] }));
  data.en.sections = SECTION_ORDER.map((key) => ({ key, label: SECTION_LABELS.en[key] }));

  for (const filePath of files) {
    const rel = toPosix(path.relative(ROOT, filePath));
    const lang = rel.startsWith('en/') ? 'en' : 'ru';
    const localPath = lang === 'en' ? rel.slice(3) : rel;
    const section = sectionFromLocal(localPath);

    if (!section) {
      continue;
    }

    const html = await fs.readFile(filePath, 'utf8');
    const title = extractTitle(html);
    if (!title) {
      continue;
    }

    const body = extractBody(html);
    data[lang].entries.push({
      section,
      url: localPath,
      title,
      body,
    });
  }

  data.ru.entries.sort((a, b) => a.url.localeCompare(b.url, 'ru'));
  data.en.entries.sort((a, b) => a.url.localeCompare(b.url, 'en'));

  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Generated ${path.basename(OUT_FILE)}: ru=${data.ru.entries.length}, en=${data.en.entries.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
