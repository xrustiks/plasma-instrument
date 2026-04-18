import { escapeHtml, getSearchIndexPath } from './search-shared.js';

function getDepth() {
  const depth = parseInt(document.documentElement.dataset.depth || '0', 10);
  return Number.isNaN(depth) ? 0 : Math.max(0, depth);
}

function getCmsArticlePath() {
  const lang = (document.documentElement.lang || 'ru') === 'en' ? 'en' : 'ru';
  const prefix = '../'.repeat(getDepth());
  return lang === 'en' ? `${prefix}en/article.html` : `${prefix}article.html`;
}

function normalizeHitUrl(hit) {
  const match = String(hit?.url || '').match(/^(?:en\/)?sections\/(sources|services|projects|blog)\/([^/]+)\/index\.html$/i);

  if (!match) {
    return hit.url;
  }

  const [, section, slug] = match;
  const query = new URLSearchParams({ section, slug });
  return `${getCmsArticlePath()}?${query.toString()}`;
}

async function loadSearchIndex() {
  const response = await fetch(getSearchIndexPath(), { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Search index request failed: ${response.status}`);
  }

  return response.json();
}

function renderGroupedHits(hits, sections, sectionTitlePrefix) {
  return sections
    .map(({ key, label }) => {
      const groupHits = hits.filter((hit) => hit.section === key);

      if (!groupHits.length) {
        return '';
      }

      const visibleHits = groupHits.filter((hit) => groupHits.length === 1 || hit.title !== label);

      return `
        <section class="search-group">
          <h2 class="search-group__title">${sectionTitlePrefix}: ${label}</h2>
          <div class="search-group__items">
            ${visibleHits.map((hit) => `
              <div class="search-result">
                <a href="${normalizeHitUrl(hit)}">${hit.title}</a>
              </div>
            `).join('')}
          </div>
        </section>
      `;
    })
    .filter(Boolean)
    .join('');
}

export function initSearchResults() {
  const resultsElement = document.getElementById('search-results');

  if (!resultsElement) {
    return;
  }

  (async () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const queryInput = document.getElementById('search-query');

    if (queryInput) {
      queryInput.value = query;
    }

    if (!query.trim()) {
      return;
    }

    const isEn = (document.documentElement.lang || 'ru') === 'en';
    const sectionTitlePrefix = isEn ? 'Section' : 'Раздел';

    try {
      const payload = await loadSearchIndex();
      const data = isEn ? payload.en : payload.ru;
      const index = Array.isArray(data?.entries) ? data.entries : [];
      const sections = Array.isArray(data?.sections) ? data.sections : [];
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

      const hits = index.filter(({ title, body }) => {
        const haystack = `${title || ''} ${body || ''}`.toLowerCase();
        return terms.some((term) => haystack.includes(term));
      });

      if (hits.length) {
        resultsElement.innerHTML = renderGroupedHits(hits, sections, sectionTitlePrefix);
        return;
      }

      const message = isEn
        ? `Nothing found for «${escapeHtml(query)}».`
        : `Ничего не найдено по запросу «${escapeHtml(query)}».`;
      resultsElement.innerHTML = `<p class="search-empty">${message}</p>`;
    } catch (error) {
      const message = isEn
        ? 'Search index is unavailable. Please try again later.'
        : 'Поисковый индекс недоступен. Повторите попытку позже.';

      resultsElement.innerHTML = `<p class="search-empty">${message}</p>`;
      console.error(error);
    }
  })();
}