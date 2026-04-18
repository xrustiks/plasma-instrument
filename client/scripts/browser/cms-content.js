import { initClickableCardLinks } from './ui/clickable-card-links.js';

const API_BASE = 'http://localhost:3000/api';

function getDepth() {
  const raw = document.documentElement.dataset.depth || '0';
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : Math.max(0, value);
}

function getRootPrefix() {
  return '../'.repeat(getDepth());
}

function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

function getSectionFromPath() {
  const path = window.location.pathname.toLowerCase();
  const match = path.match(/\/(?:en\/)?sections\/(sources|services|projects|blog)\/?(?:index\.html)?$/i);
  return match ? match[1] : '';
}

function isSectionIndexPage() {
  return Boolean(getSectionFromPath());
}

function isCmsArticlePage() {
  return Boolean(document.querySelector('[data-cms-article]'));
}

function formatDate(dateString, lang) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function buildArticleUrl(articleId, section) {
  const base = getRootPrefix();
  const lang = getLanguage();
  if (lang === 'en') {
    return `${base}en/article.html?id=${encodeURIComponent(articleId)}&section=${encodeURIComponent(section)}`;
  }

  return `${base}article.html?id=${encodeURIComponent(articleId)}&section=${encodeURIComponent(section)}`;
}

function normalizeImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/')) return `http://localhost:3000${imagePath}`;
  return imagePath;
}

function pickTitle(article, lang) {
  if (lang === 'en') {
    return article.titleEn || article.titleRu || '';
  }

  return article.titleRu || article.titleEn || '';
}

function pickContent(article, lang) {
  if (lang === 'en') {
    return article.contentEn || article.contentRu || '';
  }

  return article.contentRu || article.contentEn || '';
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeExcerpt(article, lang, limit = 170) {
  const source = stripHtml(pickContent(article, lang));
  if (!source) {
    return lang === 'en' ? 'Read more in the article.' : 'Подробнее в статье.';
  }

  if (source.length <= limit) {
    return source;
  }

  return `${source.slice(0, limit).trim()}...`;
}

function getDefaultImage(section) {
  const base = getRootPrefix();
  const defaults = {
    blog: `${base}images/cards/blog/shpindel.jpg`,
    services: `${base}images/cards/services/service-export-icon.png`,
    projects: `${base}images/cards/projects/pro1.jpg`,
    sources: `${base}images/cards/sources/ionnoluchevye-istochniki.jpg`
  };

  return defaults[section] || '';
}

function getGridForSection(section) {
  if (section === 'blog') {
    return document.querySelector('.cards-grid');
  }

  if (section === 'services') {
    return document.querySelector('.svc-grid');
  }

  if (section === 'projects' || section === 'sources') {
    return document.querySelector('.topic-grid');
  }

  return null;
}

function buildCardMarkupForSection(article, section, lang) {
  const title = pickTitle(article, lang);
  const articleUrl = buildArticleUrl(article.id, section);
  const imageUrl = normalizeImageUrl(article.cardImage) || getDefaultImage(section);
  const excerpt = makeExcerpt(article, lang);
  const date = formatDate(article.date, lang);

  if (section === 'services') {
    return `
      <article class="svc-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
        <div class="svc-card__img-wrap">
          <img class="svc-card__img" src="${imageUrl}" alt="${title}">
        </div>
        <a class="svc-card__title" href="${articleUrl}">${title}</a>
        <p class="svc-card__desc">${excerpt}</p>
      </article>
    `;
  }

  if (section === 'projects') {
    return `
      <article class="topic-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
        <span class="topic-card__icon" aria-hidden="true"><img src="${imageUrl}" alt="${title}"></span>
        <h3 class="topic-card__title"><a href="${articleUrl}">${title}</a></h3>
      </article>
    `;
  }

  if (section === 'sources') {
    return `
      <article class="topic-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
        <span class="topic-card__icon" aria-hidden="true"><img src="${imageUrl}" alt="${title}"></span>
        <h3 class="topic-card__title"><a href="${articleUrl}">${title}</a></h3>
        <p class="topic-card__desc">${excerpt}</p>
      </article>
    `;
  }

  return `
    <article class="card blog-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
      <div class="blog-card__thumb"><img src="${imageUrl}" alt="${title}"></div>
      <h3><a href="${articleUrl}">${title}</a></h3>
      <p>${date}</p>
    </article>
  `;
}

async function initSectionCardsFromCms() {
  if (!isSectionIndexPage()) return;

  const section = getSectionFromPath();
  const lang = getLanguage();

  try {
    const response = await fetch(`${API_BASE}/articles?section=${encodeURIComponent(section)}`);
    if (!response.ok) return;

    const articles = await response.json();
    if (!Array.isArray(articles) || articles.length === 0) return;

    const grid = getGridForSection(section);
    if (!grid) return;

    grid.querySelectorAll('[data-cms-card="1"]').forEach((node) => node.remove());

    const sorted = [...articles].sort((a, b) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();
      return right - left;
    });

    const cardsMarkup = sorted.map((article) => buildCardMarkupForSection(article, section, lang)).join('');
    grid.insertAdjacentHTML('afterbegin', cardsMarkup);

    initClickableCardLinks();
  } catch {
    // Keep static page fully functional when API is unavailable.
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getSectionLink(section, lang) {
  const base = getRootPrefix();
  if (!section) return lang === 'en' ? `${base}en/` : `${base}`;

  if (lang === 'en') {
    return `${base}en/sections/${section}/`;
  }

  return `${base}sections/${section}/`;
}

function renderArticlePage(article, section) {
  const lang = getLanguage();
  const title = pickTitle(article, lang);
  const content = pickContent(article, lang);
  const imageUrl = normalizeImageUrl(article.cardImage);

  const titleNode = document.querySelector('[data-cms-article-title]');
  const dateNode = document.querySelector('[data-cms-article-date]');
  const contentNode = document.querySelector('[data-cms-article-content]');
  const crumbNode = document.querySelector('[data-cms-article-breadcrumb-section]');
  const backNode = document.querySelector('[data-cms-back-link]');
  const heroNode = document.querySelector('[data-cms-article-hero]');

  if (titleNode) titleNode.textContent = title;
  if (dateNode) dateNode.textContent = formatDate(article.date, lang);
  if (contentNode) contentNode.innerHTML = content;

  const sectionLabelMap = {
    ru: {
      sources: 'Технологические источники',
      services: 'Услуги',
      projects: 'Инвестиционные и научные проекты',
      blog: 'Блог'
    },
    en: {
      sources: 'Technological sources',
      services: 'Services',
      projects: 'Investment and scientific projects',
      blog: 'Blog'
    }
  };

  const sectionLabel = sectionLabelMap[lang][section] || (lang === 'en' ? 'Section' : 'Раздел');
  const sectionLink = getSectionLink(section, lang);

  if (crumbNode) {
    crumbNode.textContent = sectionLabel;
    crumbNode.setAttribute('href', sectionLink);
  }

  if (backNode) {
    backNode.setAttribute('href', sectionLink);
  }

  if (heroNode) {
    if (imageUrl) {
      heroNode.innerHTML = `<img src="${imageUrl}" alt="${title}">`;
      heroNode.classList.remove('is-empty');
    } else {
      heroNode.innerHTML = '';
      heroNode.classList.add('is-empty');
    }
  }
}

function renderArticleError() {
  const lang = getLanguage();
  const titleNode = document.querySelector('[data-cms-article-title]');
  const contentNode = document.querySelector('[data-cms-article-content]');

  if (titleNode) {
    titleNode.textContent = lang === 'en' ? 'Article is unavailable' : 'Статья недоступна';
  }

  if (contentNode) {
    contentNode.innerHTML = `<p>${lang === 'en' ? 'Failed to load article data from API.' : 'Не удалось загрузить данные статьи из API.'}</p>`;
  }
}

async function initCmsArticlePage() {
  if (!isCmsArticlePage()) return;

  const articleId = getQueryParam('id');
  const section = getQueryParam('section') || 'blog';

  if (!articleId) {
    renderArticleError();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/articles/${encodeURIComponent(articleId)}`);
    if (!response.ok) {
      renderArticleError();
      return;
    }

    const article = await response.json();
    renderArticlePage(article, section);
  } catch {
    renderArticleError();
  }
}

export function initCmsContent() {
  initSectionCardsFromCms();
  initCmsArticlePage();
}
