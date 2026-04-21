import './api-base-config.js';
import { initHomeCarousel } from './ui/home-carousel.js';
import { initTestimonialLightbox } from './ui/testimonial-lightbox.js';

const API_BASE = typeof window.__resolveApiBase === 'function'
  ? window.__resolveApiBase()
  : '/api';

const ABOUT_ICON_SVG = {
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"></path></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"></circle></svg>',
  science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 0 1 6 0v1"></path><path d="M6 10.5h3v2.5H6a2 2 0 0 1 0-4h3"></path><path d="M18 10.5h-3v2.5h3a2 2 0 0 0 0-4h-3"></path><path d="M8 16.5l2-1 2 1 2-1 2 1"></path></svg>'
};

const BENEFIT_ICON_SVG = {
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9V8a4 4 0 0 1 8 0v1"></path><path d="M7.2 9h9.6"></path><circle cx="12" cy="12.2" r="2.3"></circle><path d="M5.2 19a6.8 6.8 0 0 1 13.6 0"></path><path d="M16.8 6.2l2.6 2.6"></path><path d="M18.1 10.1l2.1-2.1"></path></svg>',
  suppliers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 15.5v-4a2 2 0 0 1 2-2h8.5v8h-10.5z"></path><path d="M14 11h3.1l2.4 2.5v2H14"></path><circle cx="7" cy="17.5" r="1.8"></circle><circle cx="16.8" cy="17.5" r="1.8"></circle><circle cx="18.5" cy="7" r="2"></circle><path d="M17.6 7l.7.7 1.3-1.4"></path></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20.5H6z"></path><path d="M14 3.5v4h4"></path><path d="M8.5 11.2h5"></path><path d="M8.5 14h5"></path><path d="M8.5 16.8h3.2"></path><path d="M15.8 12.2V17"></path><path d="M14.6 13.3h2.4"></path><path d="M14.6 16h2.4"></path></svg>',
  approval: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2"></rect><path d="M9 4.5h6"></path><path d="M9 12l2 2 4-4"></path><path d="M3 10h2"></path><path d="M2 13h3"></path></svg>',
  support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"></path><path d="M10 12.2l1.8 1.8 3.2-3.2"></path><path d="M15.5 15.5l2.5 2.5"></path><circle cx="18.8" cy="18.8" r="1.2"></circle></svg>',
  cad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8"></path><path d="M12 16v4"></path><path d="M9 9l3-1.6 3 1.6-3 1.6-3-1.6z"></path><path d="M9 9v3.2l3 1.6 3-1.6V9"></path></svg>'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeImageUrl(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    const origin = window.location.origin;
    return origin && origin !== 'null' ? `${origin}${url}` : url;
  }

  return url;
}

function getLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

function pick(item, keyRu, keyEn, lang) {
  if (lang === 'en') {
    return item[keyEn] || item[keyRu] || '';
  }

  return item[keyRu] || item[keyEn] || '';
}

function paragraphsFromText(value) {
  const source = String(value || '').trim();
  if (!source) {
    return [];
  }

  return source
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isHomePage() {
  return Boolean(document.querySelector('.about-grid') && document.querySelector('.section-benefits'));
}

function renderAbout(items, lang) {
  const grid = document.querySelector('.about-grid');
  if (!grid || !Array.isArray(items)) {
    return;
  }

  grid.innerHTML = items.map((item) => {
    const title = escapeHtml(pick(item, 'titleRu', 'titleEn', lang));
    const text = escapeHtml(pick(item, 'textRu', 'textEn', lang));

    if (item.type === 'number') {
      return `
        <article class="about-card">
          <div class="about-card__header">
            <span class="about-card__number">${escapeHtml(item.number || '')}</span>
            <h3>${title}</h3>
          </div>
          <p>${text}</p>
        </article>
      `;
    }

    const iconUrl = normalizeImageUrl(item.iconUrl);
    const iconMarkup = iconUrl
      ? `<img src="${escapeHtml(iconUrl)}" alt="" aria-hidden="true" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`
      : (ABOUT_ICON_SVG[item.iconKey] || ABOUT_ICON_SVG.bolt);
    return `
      <article class="about-card">
        <div class="about-card__header">
          <span class="about-card__icon" aria-hidden="true">${iconMarkup}</span>
          <h3>${title}</h3>
        </div>
        <p>${text}</p>
      </article>
    `;
  }).join('');
}

function renderBenefits(items, lang) {
  const grid = document.querySelector('.section-benefits .topic-grid');
  if (!grid || !Array.isArray(items)) {
    return;
  }

  grid.innerHTML = items.map((item) => {
    const title = escapeHtml(pick(item, 'titleRu', 'titleEn', lang));
    const iconUrl = normalizeImageUrl(item.iconUrl);
    const iconMarkup = iconUrl
      ? `<img src="${escapeHtml(iconUrl)}" alt="" aria-hidden="true" style="width: 100%; height: 100%; object-fit: contain; display: block; padding: 15px;" />`
      : (BENEFIT_ICON_SVG[item.iconKey] || BENEFIT_ICON_SVG.team);

    return `
      <article class="topic-card">
        <span class="topic-card__icon" aria-hidden="true">${iconMarkup}</span>
        <h3 class="topic-card__title">${title}</h3>
      </article>
    `;
  }).join('');
}

function renderTestimonials(items, lang) {
  const frame = document.querySelector('.section-testimonials .slider-frame[data-carousel]');
  if (!frame || !Array.isArray(items) || !items.length) {
    return;
  }

  const slides = items.map((item, index) => {
    const isActive = index === 0 ? ' is-active' : '';
    const company = escapeHtml(pick(item, 'companyRu', 'companyEn', lang));
    const imageAlt = escapeHtml(pick(item, 'imageAltRu', 'imageAltEn', lang));
    const imageUrl = escapeHtml(item.imageUrl || '');
    const texts = paragraphsFromText(pick(item, 'textRu', 'textEn', lang));
    const textMarkup = texts.map((line) => `<p>${escapeHtml(line)}</p>`).join('');

    return `
      <article class="slide${isActive}">
        <a class="testimonial-lightbox-link" href="${imageUrl}" data-lightbox-gallery="testimonials" target="_blank" rel="noopener noreferrer">
          <img src="${imageUrl}" alt="${imageAlt}" style="width: 220px; max-width: 100%; border-radius: 8px; border: 1px solid var(--line); margin-bottom: 1rem;" />
        </a>
        ${textMarkup}
        <h3 style="margin: 0; font-size: 1.1rem;">${company}</h3>
      </article>
    `;
  }).join('');

  const dotsAria = lang === 'en' ? 'Testimonials switcher' : 'Переключение отзывов';
  const prevAria = lang === 'en' ? 'Previous testimonial' : 'Предыдущий отзыв';
  const nextAria = lang === 'en' ? 'Next testimonial' : 'Следующий отзыв';
  const itemLabel = lang === 'en' ? 'Testimonial' : 'Отзыв';

  const dots = items.map((_, index) => {
    const activeClass = index === 0 ? ' class="is-active"' : '';
    return `<button${activeClass} type="button" aria-label="${itemLabel} ${index + 1}"></button>`;
  }).join('');

  frame.innerHTML = `
    ${slides}
    <div class="slider-dots" role="tablist" aria-label="${dotsAria}">${dots}</div>
    <button class="slider-nav slider-nav--prev" aria-label="${prevAria}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
    <button class="slider-nav slider-nav--next" aria-label="${nextAria}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
  `;

  initHomeCarousel();
  initTestimonialLightbox();
}

function renderPartners(items, lang) {
  const grid = document.querySelector('.partners-grid');
  if (!grid || !Array.isArray(items)) {
    return;
  }

  grid.innerHTML = items.map((item) => {
    const alt = escapeHtml(pick(item, 'altRu', 'altEn', lang));
    const imageUrl = escapeHtml(item.imageUrl || '');

    return `
      <article class="card" style="display: grid; place-items: center; min-height: 120px;">
        <img src="${imageUrl}" alt="${alt}" style="max-width: 100%; max-height: 60px; object-fit: contain;" />
      </article>
    `;
  }).join('');
}

async function fetchHomeContent() {
  const response = await fetch(`${API_BASE}/home-content`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`home content request failed: ${response.status}`);
  }

  return response.json();
}

export async function initHomePageContent() {
  if (!isHomePage()) {
    return;
  }

  try {
    const payload = await fetchHomeContent();
    const lang = getLang();

    renderAbout(payload.about, lang);
    renderBenefits(payload.benefits, lang);
    renderTestimonials(payload.testimonials, lang);
    renderPartners(payload.partners, lang);
  } catch (error) {
    console.error('[home-content] failed to load dynamic home sections', error);
  }
}
