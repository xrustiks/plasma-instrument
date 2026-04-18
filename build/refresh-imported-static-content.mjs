import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const CLIENT_ROOT = path.join(ROOT, 'client');
const DATA_FILE = path.join(ROOT, 'server', 'storage', 'data', 'articles.json');

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

function getTagBounds(html, startIndex, tagName) {
  const openRe = new RegExp(`<${tagName}\\b`, 'ig');
  const closeRe = new RegExp(`</${tagName}>`, 'ig');

  openRe.lastIndex = startIndex;
  const openMatch = openRe.exec(html);
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
      start: bounds.start,
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

function sourceSlugFromNew(slug) {
  const m = slug.match(/^(.*?)-new(?:-\d+)?$/);
  return m ? m[1] : null;
}

async function main() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const articles = JSON.parse(raw);

  const sectionMap = new Map();
  for (const section of ['blog', 'projects', 'services', 'sources']) {
    const indexPath = path.join(CLIENT_ROOT, 'sections', section, 'index.html');
    const indexHtml = await fs.readFile(indexPath, 'utf8');
    sectionMap.set(section, parseCardImageMap(indexHtml, indexPath));
  }

  let updated = 0;
  for (const article of articles) {
    if (!article.titleRu?.endsWith('[NEW]') || !article.titleEn?.endsWith('[NEW]')) {
      continue;
    }

    const srcSlug = sourceSlugFromNew(article.slug);
    if (!srcSlug) continue;

    const ruFile = path.join(CLIENT_ROOT, 'sections', article.section, srcSlug, 'index.html');
    const enFile = path.join(CLIENT_ROOT, 'en', 'sections', article.section, srcSlug, 'index.html');

    try {
      const [ruHtml, enHtml] = await Promise.all([
        fs.readFile(ruFile, 'utf8'),
        fs.readFile(enFile, 'utf8')
      ]);

      const contentRu = extractContent(ruHtml, ruFile);
      const contentEn = extractContent(enHtml, enFile);
      if (!contentRu || !contentEn) continue;

      article.contentRu = contentRu;
      article.contentEn = contentEn;
      article.cardImage = sectionMap.get(article.section)?.get(srcSlug) || article.cardImage || '';
      updated += 1;
    } catch {
      // Skip missing static pair.
    }
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(articles, null, 2)}\n`, 'utf8');
  console.log('Updated imported NEW articles:', updated);
}

main().catch((error) => {
  console.error('Refresh failed:', error);
  process.exit(1);
});
