const COMPONENT_BASE = 'scripts/browser/components';
const COMPONENT_CACHE = new Map();

function getDepth() {
  const raw = document.documentElement.dataset.depth || '0';
  const value = parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : Math.max(0, value);
}

function getRootPrefix() {
  return '../'.repeat(getDepth());
}

function getLocalPathFromRoot() {
  const depth = getDepth();
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts.slice(-(depth + 1)).join('/');
}

function normalizeLocalPath(localPath) {
  const strippedSlashes = (localPath || '').replace(/^\/+|\/+$/g, '');
  const withoutIndex = strippedSlashes.replace(/(^|\/)index\.html$/i, '').replace(/\/+$/g, '');
  return withoutIndex;
}

function formatPathForLink(path) {
  if (!path) return '';
  if (/\.html$/i.test(path)) return path;
  return `${path.replace(/\/+$/g, '')}/`;
}

function withBase(base, path) {
  const href = `${base}${path}`;
  return href || './';
}

function isSameOrChildPath(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function getSectionFromPath(localPath, lang) {
  const normalizedLocalPath = normalizeLocalPath(localPath);
  const normalized = lang === 'en' ? normalizedLocalPath.replace(/^en\/?/, '') : normalizedLocalPath;

  if (!normalized) return 'home';
  if (isSameOrChildPath(normalized, 'sections/sources')) return 'sources';
  if (isSameOrChildPath(normalized, 'sections/services')) return 'services';
  if (isSameOrChildPath(normalized, 'sections/projects')) return 'projects';
  if (isSameOrChildPath(normalized, 'sections/blog')) return 'blog';
  if (isSameOrChildPath(normalized, 'sections/contacts')) return 'contacts';
  return '';
}

function getPathForLanguage(localPath, targetLang) {
  const normalized = normalizeLocalPath(localPath);
  const isArticlePage = /(^|\/)article\.html$/i.test(normalized);
  const search = window.location.search || '';

  if (isArticlePage && search) {
    if (targetLang === 'en') {
      return formatPathForLink(normalized.startsWith('en/') ? normalized : `en/${normalized}`) + search;
    }

    return formatPathForLink(normalized.replace(/^en\/?/, '')) + search;
  }

  if (targetLang === 'en') {
    if (!normalized) return 'en/';
    if (normalized.startsWith('en/')) return formatPathForLink(normalized);
    return formatPathForLink(`en/${normalized}`);
  }

  const ruPath = normalized.replace(/^en\/?/, '');
  return formatPathForLink(ruPath);
}

function getLanguageSwitchPath(localPath, lang) {
  return lang === 'en' ? getPathForLanguage(localPath, 'ru') : getPathForLanguage(localPath, 'en');
}

function normalizeInternalHref(href) {
  if (!href) return href;
  if (/^(?:[a-z]+:|\/\/|#|mailto:|tel:)/i.test(href)) return href;

  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

  if (!/index\.html$/i.test(path)) return href;

  const normalizedPath = path.replace(/index\.html$/i, '') || './';
  return `${normalizedPath}${query}${hash}`;
}

function normalizeCurrentUrl() {
  if (window.location.protocol === 'file:') return;

  const pathname = window.location.pathname;
  if (!/index\.html$/i.test(pathname)) return;

  const normalizedPathname = pathname.replace(/index\.html$/i, '') || '/';
  const nextUrl = `${normalizedPathname}${window.location.search}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function normalizeDocumentLinks() {
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    const normalizedHref = normalizeInternalHref(href);

    if (normalizedHref !== href) {
      link.setAttribute('href', normalizedHref);
    }
  });

  document.querySelectorAll('[data-href]').forEach((node) => {
    const dataHref = node.getAttribute('data-href');
    const normalizedHref = normalizeInternalHref(dataHref);

    if (normalizedHref !== dataHref) {
      node.setAttribute('data-href', normalizedHref);
    }
  });
}

function getLayoutContext() {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const isEn = lang === 'en';
  const base = getRootPrefix();
  const localPath = getLocalPathFromRoot();
  const section = getSectionFromPath(localPath, lang);
  const currentYear = new Date().getFullYear();

  const links = {
    home: isEn ? withBase(base, 'en/') : withBase(base, ''),
    sources: isEn ? withBase(base, 'en/sections/sources/') : withBase(base, 'sections/sources/'),
    services: isEn ? withBase(base, 'en/sections/services/') : withBase(base, 'sections/services/'),
    projects: isEn ? withBase(base, 'en/sections/projects/') : withBase(base, 'sections/projects/'),
    blog: isEn ? withBase(base, 'en/sections/blog/') : withBase(base, 'sections/blog/'),
    contacts: isEn ? withBase(base, 'en/sections/contacts/') : withBase(base, 'sections/contacts/'),
    langRu: withBase(base, getPathForLanguage(localPath, 'ru')),
    langEn: withBase(base, getPathForLanguage(localPath, 'en')),
    langSwitch: withBase(base, getLanguageSwitchPath(localPath, lang)),
  };

  const text = {
    brandTitle: isEn ? 'IVC PLASMAINSTRUMENT' : 'ИВЦ ПЛАЗМАИНСТРУМЕНТ',
    brandSubtitle: isEn ? 'Vacuum technologies' : 'Вакуумные технологии',
    navHome: isEn ? 'Home' : 'Главная',
    navSources: isEn ? 'Technological sources' : 'Технологические источники',
    navServices: isEn ? 'Services' : 'Услуги',
    navProjects: isEn ? 'Investment and scientific projects' : 'Инвестиционные и научные проекты',
    navBlog: isEn ? 'Blog' : 'Блог',
    navContacts: isEn ? 'Contacts' : 'Контакты',
    searchPlaceholder: isEn ? 'Search...' : 'Поиск...',
    searchAria: isEn ? 'Search' : 'Найти',
    menuAria: isEn ? 'Main menu' : 'Главное меню',
    languageAria: isEn ? 'Language switch' : 'Переключение языка',
    burgerAria: isEn ? 'Open menu' : 'Открыть меню',
    address: isEn ? '420087, Kazan, Daurskaya 41, office 7' : '420087, РТ, г. Казань, ул. Даурская 41, оф. 7',
    menuTitle: isEn ? 'Menu' : 'Разделы',
    contactsTitle: isEn ? 'Contacts' : 'Контакты',
    copyrightText: `Copyright. 2018 - ${currentYear}`,
  };

  const assets = {
    logo: `${base}images/logo.jpg`,
  };

  return {
    lang,
    section,
    links,
    text,
    assets,
  };
}

function bindText(root, textMap) {
  root.querySelectorAll('[data-text]').forEach((node) => {
    const key = node.dataset.text;
    if (!key || !(key in textMap)) return;
    node.textContent = textMap[key];
  });
}

function bindLinks(root, links) {
  root.querySelectorAll('[data-link]').forEach((node) => {
    const key = node.dataset.link;
    if (!key || !(key in links)) return;
    node.setAttribute('href', links[key]);
  });
}

function bindSources(root, assets) {
  root.querySelectorAll('[data-src]').forEach((node) => {
    const key = node.dataset.src;
    if (!key || !(key in assets)) return;
    node.setAttribute('src', assets[key]);
  });
}

function bindAria(root, textMap) {
  root.querySelectorAll('[data-aria]').forEach((node) => {
    const key = node.dataset.aria;
    if (!key || !(key in textMap)) return;
    node.setAttribute('aria-label', textMap[key]);
  });
}

function bindPlaceholders(root, textMap) {
  root.querySelectorAll('[data-placeholder]').forEach((node) => {
    const key = node.dataset.placeholder;
    if (!key || !(key in textMap)) return;
    node.setAttribute('placeholder', textMap[key]);
  });
}

function applyHeaderBindings(header, context) {
  bindLinks(header, context.links);
  bindText(header, context.text);
  bindSources(header, context.assets);
  bindAria(header, context.text);
  bindPlaceholders(header, context.text);

  const logo = header.querySelector('.brand-logo');
  if (logo) {
    logo.setAttribute('alt', context.text.brandTitle);
  }

  const navLabels = {
    home: context.text.navHome,
    sources: context.text.navSources,
    services: context.text.navServices,
    projects: context.text.navProjects,
    blog: context.text.navBlog,
    contacts: context.text.navContacts,
  };

  header.querySelectorAll('[data-nav]').forEach((link) => {
    const key = link.dataset.nav;
    if (!key) return;

    if (key in navLabels) {
      link.textContent = navLabels[key];
    }

    link.classList.toggle('active', key === context.section);
  });

  const langRu = header.querySelector('[data-lang="ru"]');
  const langEn = header.querySelector('[data-lang="en"]');

  if (langRu) {
    langRu.setAttribute('href', context.links.langRu);
    langRu.classList.toggle('active', context.lang === 'ru');
  }

  if (langEn) {
    langEn.setAttribute('href', context.links.langEn);
    langEn.classList.toggle('active', context.lang === 'en');
  }
}

function applyFooterBindings(footer, context) {
  bindLinks(footer, context.links);
  bindText(footer, context.text);
  bindSources(footer, context.assets);

  const logo = footer.querySelector('.footer-brand__logo');
  if (logo) {
    logo.setAttribute('alt', context.text.brandTitle);
  }
}

function parseTemplateToElement(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
}

async function loadComponentTemplate(base, componentName) {
  const path = `${base}${COMPONENT_BASE}/${componentName}.html`;

  if (COMPONENT_CACHE.has(path)) {
    return COMPONENT_CACHE.get(path);
  }

  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load ${componentName} component: ${response.status}`);
  }

  const html = await response.text();
  COMPONENT_CACHE.set(path, html);
  return html;
}

async function mountLayout() {
  normalizeCurrentUrl();
  const context = getLayoutContext();
  const base = getRootPrefix();

  const headerSlot = document.querySelector('[data-site-header]');
  if (headerSlot) {
    const headerHtml = await loadComponentTemplate(base, 'header');
    const headerElement = parseTemplateToElement(headerHtml);

    if (headerElement) {
      applyHeaderBindings(headerElement, context);
      headerSlot.replaceWith(headerElement);
    }
  }

  const footerSlot = document.querySelector('[data-site-footer]');
  if (footerSlot) {
    const footerHtml = await loadComponentTemplate(base, 'footer');
    const footerElement = parseTemplateToElement(footerHtml);

    if (footerElement) {
      applyFooterBindings(footerElement, context);
      footerSlot.replaceWith(footerElement);
    }
  }

  normalizeDocumentLinks();
}

export const layoutReady = mountLayout().catch((error) => {
  console.error('[layout] failed to mount header/footer components', error);
  normalizeDocumentLinks();
});
