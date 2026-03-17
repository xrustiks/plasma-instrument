export function getSearchIndexPath() {
  const depth = parseInt(document.documentElement.dataset.depth || '0', 10);
  const safeDepth = Number.isNaN(depth) ? 0 : Math.max(0, depth);
  return '../'.repeat(safeDepth) + 'search-index.json';
}

export function getSearchPagePath() {
  const lang = document.documentElement.lang || 'ru';
  const depth = parseInt(document.documentElement.dataset.depth || '0', 10);
  const safeDepth = Number.isNaN(depth) ? 0 : Math.max(0, depth);

  if (lang === 'en') {
    return '../'.repeat(Math.max(0, safeDepth - 1)) + 'search.html';
  }

  return '../'.repeat(safeDepth) + 'search.html';
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}