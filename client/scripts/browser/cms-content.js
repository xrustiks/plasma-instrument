import { initClickableCardLinks } from './ui/clickable-card-links.js';
import { initArticleContentLayout } from './ui/article-content-layout.js';
import { initArticleGalleryLightbox } from './ui/article-gallery-lightbox.js';
import './api-base-config.js';

// Этот модуль отвечает за интеграцию с CMS для загрузки и отображения контента статей, 
// а также за миграцию старых статических страниц разделов на динамические страницы, 
// использующие данные из CMS
const API_BASE = typeof window.__resolveApiBase === 'function'
  ? window.__resolveApiBase()
  : '/api';

// Получает базовый URL API, учитывая возможные конфигурации и 
// обеспечивая корректное формирование абсолютных URL для ресурсов
function getApiOrigin() {
  try {
    return new URL(API_BASE, window.location.origin).origin;
  } catch {
    const origin = window.location.origin;
    return origin && origin !== 'null' ? origin : '';
  }
}

// Получает глубину вложенности текущей страницы относительно корневой директории сайта
function getDepth() {
  const raw = document.documentElement.dataset.depth || '0';
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : Math.max(0, value);
}

function getRootPrefix() {
  return '../'.repeat(getDepth());
}

// Определяет язык страницы на основе атрибута lang в элементе <html>.
function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

/**
 * @deprecated v2.0 - This function detects old static article paths.
 * Static articles have been migrated to CMS.
 * Old files are archived in .deprecated/sections/ and .deprecated/en_sections/
 * Migration complete as of 2026-04-18. Scheduled for complete removal after 2026-05-30.
 */
function getSectionFromPath() {
  const path = window.location.pathname.toLowerCase();
  const match = path.match(/\/(?:en\/)?sections\/(sources|services|projects|blog)\/?(?:index\.html)?$/i);
  return match ? match[1] : '';
}

// Определяет, находится ли пользователь на странице раздела 
// (источники, услуги, проекты, блог)
function isSectionIndexPage() {
  return Boolean(getSectionFromPath());
}

// Определяет, находится ли пользователь на странице статьи CMS,
// которая содержит атрибут data-cms-article
function isCmsArticlePage() {
  return Boolean(document.querySelector('[data-cms-article]'));
}

// Форматирует строку даты в человекочитаемый формат, используя Intl.DateTimeFormat для локализации
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

// Строит URL для статьи на основе ее ID и раздела, 
// учитывая язык страницы для правильного формирования пути
function buildArticleUrl(articleId, section) {
  const base = getRootPrefix();
  const lang = getLanguage();
  if (lang === 'en') {
    return `${base}en/article.html?id=${encodeURIComponent(articleId)}&section=${encodeURIComponent(section)}`;
  }

  return `${base}article.html?id=${encodeURIComponent(articleId)}&section=${encodeURIComponent(section)}`;
}

// Нормализует URL изображения, обеспечивая корректное формирование абсолютного URL для ресурсов,
// особенно для изображений, предоставляемых CMS, которые могут быть указаны как относительные пути
function normalizeImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/')) {
    const origin = getApiOrigin();
    if (origin && origin !== 'null') {
      return `${origin}${imagePath}`;
    }
  }
  return imagePath;
}

// Нормализует URL, обеспечивая корректное формирование абсолютного URL для ресурсов, 
// особенно для ссылок и других атрибутов, предоставляемых CMS, которые могут быть указаны как относительные пути
function normalizeUrlToApiOrigin(value) {
  if (!value) return value;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/')) {
    const origin = getApiOrigin();
    if (origin && origin !== 'null') {
      return `${origin}${value}`;
    }
  }

  return value;
}

// Нормализует атрибут srcset, обеспечивая корректное формирование абсолютных URL для ресурсов, 
// особенно для изображений, предоставляемых CMS, которые могут быть указаны как относительные пути
function normalizeSrcSetToApiOrigin(srcset) {
  if (!srcset) return srcset;

  return srcset
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return trimmed;

      const [url, descriptor] = trimmed.split(/\s+/, 2);
      const normalizedUrl = normalizeUrlToApiOrigin(url);
      return descriptor ? `${normalizedUrl} ${descriptor}` : normalizedUrl;
    })
    .join(', ');
}

// Нормализует HTML-контент статьи, обеспечивая корректное формирование абсолютных URL для 
// всех ресурсов внутри контента, 
// таких как изображения, ссылки, видео и другие медиа, которые могут быть предоставлены CMS как относительные пути
function normalizeCmsContentHtml(html) {
  if (!html) return '';

  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('[src]').forEach((node) => {
    const src = node.getAttribute('src');
    if (src) {
      node.setAttribute('src', normalizeUrlToApiOrigin(src));
    }
  });

  template.content.querySelectorAll('[href]').forEach((node) => {
    const href = node.getAttribute('href');
    if (href) {
      node.setAttribute('href', normalizeUrlToApiOrigin(href));
    }
  });

  template.content.querySelectorAll('[poster]').forEach((node) => {
    const poster = node.getAttribute('poster');
    if (poster) {
      node.setAttribute('poster', normalizeUrlToApiOrigin(poster));
    }
  });

  template.content.querySelectorAll('[srcset]').forEach((node) => {
    const srcset = node.getAttribute('srcset');
    if (srcset) {
      node.setAttribute('srcset', normalizeSrcSetToApiOrigin(srcset));
    }
  });

  // Добавляем lazy loading для всех img элементов в контенте
  template.content.querySelectorAll('img').forEach((node) => {
    if (!node.hasAttribute('loading')) {
      node.setAttribute('loading', 'lazy');
    }
  });

  return template.innerHTML;
}

// Выбирает заголовок статьи на основе языка страницы, обеспечивая корректное отображение заголовков для многоязычных статей
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

// Удаляет все HTML-теги из строки и нормализует пробельные символы, обеспечивая чистый текст для создания анонсов статей и других текстовых фрагментов
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Создает анонс статьи, удаляя HTML-теги и ограничивая длину текста, обеспечивая краткое описание статьи для отображения в карточках и списках статей
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

// Получает контейнер сетки для карточек в зависимости от раздела, обеспечивая правильное размещение карточек статей в соответствующих разделах сайта
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

// Строит HTML-разметку карточки статьи для заданного раздела, обеспечивая единообразное отображение статей в различных разделах сайта с учетом специфики каждого раздела
function buildCardMarkupForSection(article, section, lang) {
  const title = pickTitle(article, lang);
  const articleUrl = buildArticleUrl(article.id, section);
  const imageUrl = normalizeImageUrl(article.cardImage);
  const excerpt = makeExcerpt(article, lang);
  const date = formatDate(article.date, lang);

  const blogMedia = imageUrl
    ? `<img src="${imageUrl}" alt="${title}" loading="lazy">`
    : '<div class="cms-card-placeholder cms-card-placeholder--wide" aria-hidden="true"></div>';

  const iconMedia = imageUrl
    ? `<img class="svc-card__img" src="${imageUrl}" alt="${title}" loading="lazy">`
    : '<div class="cms-card-placeholder" aria-hidden="true"></div>';

  if (section === 'services') {
    return `
      <article class="svc-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
        <div class="svc-card__img-wrap">
          ${iconMedia}
        </div>
        <a class="svc-card__title" href="${articleUrl}">${title}</a>
        <p class="svc-card__desc">${excerpt}</p>
      </article>
    `;
  }

  if (section === 'projects') {
    return `
      <article class="topic-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
        <span class="topic-card__icon" aria-hidden="true">${iconMedia}</span>
        <h3 class="topic-card__title"><a href="${articleUrl}">${title}</a></h3>
      </article>
    `;
  }

  if (section === 'sources') {
    return `
      <article class="topic-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
        <span class="topic-card__icon" aria-hidden="true">${iconMedia}</span>
        <h3 class="topic-card__title"><a href="${articleUrl}">${title}</a></h3>
        <p class="topic-card__desc">${excerpt}</p>
      </article>
    `;
  }

  return `
    <article class="card blog-card" data-href="${articleUrl}" role="link" tabindex="0" data-cms-card="1" data-cms-id="${article.id}">
      <div class="blog-card__thumb">${blogMedia}</div>
      <h3><a href="${articleUrl}">${title}</a></h3>
      <p>${date}</p>
    </article>
  `;
}

// Инициализирует карточки статей на странице раздела, загружая данные из CMS и динамически создавая карточки статей, обеспечивая актуальный контент на страницах разделов и плавную миграцию со статических страниц на динамические
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

// Получает значение параметра из строки запроса URL
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Получает ссылку на страницу раздела для хлебных крошек
function getSectionLink(section, lang) {
  const base = getRootPrefix();
  if (!section) return lang === 'en' ? `${base}en/` : `${base}`;

  if (lang === 'en') {
    return `${base}en/sections/${section}/`;
  }

  return `${base}sections/${section}/`;
}

// Перемещает изображения из контента статьи в отдельную галерею
function moveCmsImagesToGallery(contentNode, lang) {
  if (!contentNode) return;

  const images = [...contentNode.querySelectorAll('img')]
    .filter((image) => !image.closest('table') && !image.closest('.article-gallery'));

  if (images.length < 2) {
    return;
  }

  const title = document.createElement('h2');
  title.className = 'article-gallery-title';
  title.textContent = lang === 'en' ? 'Gallery' : 'Галерея';

  const gallery = document.createElement('div');
  gallery.className = 'article-gallery';
  gallery.setAttribute('aria-label', lang === 'en' ? 'Article gallery' : 'Галерея статьи');

  images.forEach((image, index) => {
    const source = image.currentSrc || image.src;
    if (!source) return;

    const link = document.createElement('a');
    link.href = source;

    const cloned = image.cloneNode(true);
    if (!cloned.alt) {
      cloned.alt = lang === 'en' ? `Article image ${index + 1}` : `Изображение статьи ${index + 1}`;
    }

    link.appendChild(cloned);
    gallery.appendChild(link);

    image.remove();
  });

  [...contentNode.querySelectorAll('p, div, figure')].forEach((node) => {
    if (node === contentNode) return;
    if (node.closest('.article-gallery')) return;

    const hasMedia = node.querySelector('img, video, iframe, table');
    const text = (node.textContent || '').replace(/\u00a0/g, ' ').trim();

    if (!hasMedia && !text) {
      node.remove();
    }
  });

  if (gallery.children.length) {
    contentNode.append(title, gallery);
  }
}

// Рендерит страницу статьи, заполняя шаблон данными из CMS
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
  // Показываем дату только для статей блога
  if (dateNode) dateNode.textContent = section === 'blog' ? formatDate(article.date, lang) : '';
  if (contentNode) {
    contentNode.classList.add('article-content');
    contentNode.innerHTML = normalizeCmsContentHtml(content);
    moveCmsImagesToGallery(contentNode, lang);
    initArticleContentLayout();
    initArticleGalleryLightbox();
  }

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
    backNode.style.display = 'none';
  }

  if (heroNode) {
    // Не показываем картинку превью для раздела услуг
    const showHeroImage = imageUrl && section !== 'services';
    
    if (showHeroImage) {
      heroNode.innerHTML = `<img src="${imageUrl}" alt="${title}" loading="lazy">`;
      heroNode.classList.remove('is-empty');
    } else {
      heroNode.innerHTML = '';
      heroNode.classList.add('is-empty');
    }
  }
}

// Рендерит сообщение об ошибке при загрузке статьи
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

// Инициализирует страницу статьи CMS, загружая данные из API на основе параметров URL и заполняя шаблон страницы
async function initCmsArticlePage() {
  if (!isCmsArticlePage()) return;

  const articleId = getQueryParam('id');
  const section = getQueryParam('section') || 'blog';
  const slug = getQueryParam('slug');

  try {
    if (articleId) {
      const response = await fetch(`${API_BASE}/articles/${encodeURIComponent(articleId)}`);
      if (!response.ok) {
        renderArticleError();
        return;
      }

      const article = await response.json();
      renderArticlePage(article, section);
      return;
    }

    if (slug && section) {
      const response = await fetch(`${API_BASE}/articles?section=${encodeURIComponent(section)}`);
      if (!response.ok) {
        renderArticleError();
        return;
      }

      const articles = await response.json();
      const article = Array.isArray(articles)
        ? articles.find((item) => item.slug === slug)
        : null;

      if (!article) {
        renderArticleError();
        return;
      }

      renderArticlePage(article, section);
      return;
    }

    renderArticleError();
  } catch {
    renderArticleError();
  }
}

export function initCmsContent() {
  initSectionCardsFromCms();
  initCmsArticlePage();
}
