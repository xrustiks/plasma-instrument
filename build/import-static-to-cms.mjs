import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const CLIENT_ROOT = path.join(ROOT, 'client');
const DATA_FILE = path.join(ROOT, 'server', 'storage', 'data', 'articles.json');
const TARGET_SECTIONS = ['blog', 'projects', 'services', 'sources'];

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function normalizeRootUrl(value, filePath) {
  if (!value) return value;
  if (/^(?:[a-z]+:)?\/\//i.test(value)) return value;
  if (/^(?:mailto:|tel:|data:|javascript:|#)/i.test(value)) return value;
  if (value.startsWith('/')) return value;

  const relFile = toPosix(path.relative(CLIENT_ROOT, filePath));
  const pageDir = `/${path.posix.dirname(relFile)}/`;
  const resolved = path.posix.normalize(path.posix.join(pageDir, value));
  return resolved.startsWith('/') ? resolved : `/${resolved}`;
}

function normalizeFragmentUrls(fragment, filePath) {
  return fragment.replace(/\b(src|href)="([^"]+)"/g, (_, attr, url) => {
    const normalized = normalizeRootUrl(url, filePath);
    return `${attr}="${normalized}"`;
  });
}

function stripTags(text) {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getTagBounds(html, startIndex, tagName) {
  const openRe = new RegExp(`<${tagName}\\b`, 'ig');
  const closeRe = new RegExp(`</${tagName}>`, 'ig');

  openRe.lastIndex = startIndex;
  let openMatch = openRe.exec(html);
  if (!openMatch || openMatch.index !== startIndex) {
    return null;
  }

  let depth = 0;
  let cursor = startIndex;

  while (cursor < html.length) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;

    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);

    if (!nextClose) return null;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + 1;
      continue;
    }

    depth -= 1;
    cursor = nextClose.index + nextClose[0].length;

    if (depth === 0) {
      return { start: startIndex, end: cursor };
    }
  }

  return null;
}

function extractFirstBlock(html, classNeedle) {
  const classRe = /<div\b[^>]*class="([^"]*)"[^>]*>/ig;
  let match;

  while ((match = classRe.exec(html))) {
    const classes = match[1];
    if (!classes.includes(classNeedle)) continue;

    const bounds = getTagBounds(html, match.index, 'div');
    if (!bounds) continue;

    return {
      html: html.slice(bounds.start, bounds.end),
      end: bounds.end
    };
  }

  return null;
}

function extractTagAfter(html, startIndex, tagName, classNeedle) {
  const re = new RegExp(`<${tagName}\\b[^>]*class="([^"]*)"[^>]*>`, 'ig');
  re.lastIndex = startIndex;
  let match;

  while ((match = re.exec(html))) {
    const classes = match[1];
    if (classNeedle && !classes.includes(classNeedle)) continue;

    const bounds = getTagBounds(html, match.index, tagName);
    if (!bounds) continue;

    return {
      start: bounds.start,
      html: html.slice(bounds.start, bounds.end),
      end: bounds.end
    };
  }

  return null;
}

function extractTitle(html) {
  const h1 = html.match(/<h1\b[^>]*class="[^"]*page-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return decodeHtml(stripTags(h1[1]));

  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) return decodeHtml(stripTags(title[1]));

  return '';
}

function extractContent(html, filePath) {
  const content = extractFirstBlock(html, 'article-content');
  if (!content) return '';

  let result = content.html;

  const galleryTitle = extractTagAfter(html, content.end, 'h2', 'article-gallery-title');
  if (galleryTitle && galleryTitle.start < content.end + 2000) {
    result += `\n${galleryTitle.html}`;

    const gallery = extractTagAfter(html, galleryTitle.end, 'div', 'article-gallery');
    if (gallery && gallery.start < galleryTitle.end + 3000) {
      result += `\n${gallery.html}`;
    }
  }

  return normalizeFragmentUrls(result, filePath);
}

function slugFromHref(href) {
  if (!href) return '';
  const noQuery = href.split('?')[0].split('#')[0];
  return noQuery.replace(/(?:^|\/)index\.html$/i, '').replace(/\/+$/g, '');
}

function parseCardImageMap(sectionIndexHtml, filePath) {
  const map = new Map();
  const articleRe = /<article\b[\s\S]*?data-href="([^"]+)"[\s\S]*?<img\b[^>]*src="([^"]+)"[\s\S]*?<\/article>/ig;
  let m;
  while ((m = articleRe.exec(sectionIndexHtml))) {
    const slug = slugFromHref(m[1]);
    const src = normalizeRootUrl(m[2], filePath);
    if (slug) map.set(slug, src);
  }

  return map;
}

function makeUniqueSlug(section, baseSlug, existing) {
  let candidate = `${baseSlug}-new`;
  let i = 2;
  while (existing.has(`${section}:${candidate}`)) {
    candidate = `${baseSlug}-new-${i}`;
    i += 1;
  }
  existing.add(`${section}:${candidate}`);
  return candidate;
}

async function dirEntriesOnly(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

async function main() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const articles = JSON.parse(raw);

  const existingKeys = new Set(articles.map((a) => `${a.section}:${a.slug}`));
  let nextId = Math.max(0, ...articles.map((a) => a.id || 0)) + 1;

  const today = new Date().toISOString().slice(0, 10);
  const created = [];

  for (const section of TARGET_SECTIONS) {
    const ruSectionDir = path.join(CLIENT_ROOT, 'sections', section);
    const enSectionDir = path.join(CLIENT_ROOT, 'en', 'sections', section);

    const ruSectionIndexPath = path.join(ruSectionDir, 'index.html');
    const ruSectionIndexHtml = await fs.readFile(ruSectionIndexPath, 'utf8');
    const cardMap = parseCardImageMap(ruSectionIndexHtml, ruSectionIndexPath);

    const slugs = await dirEntriesOnly(ruSectionDir);
    for (const slug of slugs) {
      if (slug === 'index.html') continue;

      const ruFile = path.join(ruSectionDir, slug, 'index.html');
      const enFile = path.join(enSectionDir, slug, 'index.html');

      let ruHtml;
      let enHtml;
      try {
        ruHtml = await fs.readFile(ruFile, 'utf8');
        enHtml = await fs.readFile(enFile, 'utf8');
      } catch {
        // Skip incomplete RU/EN pairs.
        continue;
      }

      const titleRu = extractTitle(ruHtml);
      const titleEn = extractTitle(enHtml);
      const contentRu = extractContent(ruHtml, ruFile);
      const contentEn = extractContent(enHtml, enFile);

      if (!titleRu || !titleEn || !contentRu || !contentEn) {
        continue;
      }

      const newSlug = makeUniqueSlug(section, slug, existingKeys);

      const entry = {
        id: nextId,
        section,
        slug: newSlug,
        titleRu: `${titleRu} [NEW]`,
        titleEn: `${titleEn} [NEW]`,
        contentRu,
        contentEn,
        cardImage: cardMap.get(slug) || '',
        date: today
      };

      articles.push(entry);
      created.push({ section, sourceSlug: slug, slug: newSlug, id: nextId });
      nextId += 1;
    }
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(articles, null, 2)}\n`, 'utf8');

  const bySection = created.reduce((acc, item) => {
    acc[item.section] = (acc[item.section] || 0) + 1;
    return acc;
  }, {});

  console.log('Imported static articles:', created.length);
  console.log('By section:', bySection);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
