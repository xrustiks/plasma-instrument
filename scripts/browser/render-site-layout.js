// Get the depth of the current page from the data attribute on the <html> element, defaulting to 0 if it's not set or invalid
function getDepth() {
  const raw = document.documentElement.dataset.depth || '0';
  const value = parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : Math.max(0, value);
}

// Reduces the path by the depth to get the correct relative path to the site root
// (for example, if the current page is at /en/sections/sources/index.html, the depth is 3 (en -> sections -> sources))
function getRootPrefix() {
  return '../'.repeat(getDepth());
}

// Get the path relative to the site root, for example "en/sections/sources/index.html"
function getLocalPathFromRoot() {
  const depth = getDepth();
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts.slice(-(depth + 1)).join('/');
}

// Normalize the local path by removing leading/trailing slashes and "index.html" suffix
function normalizeLocalPath(localPath) {
  const strippedSlashes = (localPath || '').replace(/^\/+|\/+$/g, '');
  const withoutIndex = strippedSlashes.replace(/(^|\/)index\.html$/i, '').replace(/\/+$/g, '');
  return withoutIndex;
}

// Format a path for use in a link, ensuring it ends with a slash if it's a directory, or remains unchanged if it's an HTML file
function formatPathForLink(path) {
  if (!path) return '';
  if (/\.html$/i.test(path)) return path;
  return `${path.replace(/\/+$/g, '')}/`;
}

// Determine the current section based on the local path and language, for example "sources" for paths starting with "sections/sources/"
function getSectionFromPath(localPath, lang) {
  const normalizedLocalPath = normalizeLocalPath(localPath);
  const normalized = lang === 'en' ? normalizedLocalPath.replace(/^en\/?/, '') : normalizedLocalPath;

  if (!normalized) return 'home';
  if (normalized.startsWith('sections/sources/')) return 'sources';
  if (normalized.startsWith('sections/services/')) return 'services';
  if (normalized.startsWith('sections/projects/')) return 'projects';
  if (normalized.startsWith('sections/blog/')) return 'blog';
  if (normalized.startsWith('sections/contacts/')) return 'contacts';
  return '';
}

// Get the path for switching languages, for example if the current path is "en/sections/sources/index.html", the Russian version would be "sections/sources/index.html", and vice versa
function getLanguageSwitchPath(localPath, lang) {
  const normalized = normalizeLocalPath(localPath);

  if (lang === 'en') {
    const ruPath = normalized.replace(/^en\/?/, '');
    return formatPathForLink(ruPath);
  }

  if (!normalized) return 'en/';

  return formatPathForLink(`en/${normalized}`);
}

// Combine the base path with the given path to create a full URL, ensuring it ends with a slash if it's a directory
function withBase(base, path) {
  const href = `${base}${path}`;
  return href || './';
}

// Normalize internal links by removing "index.html" suffixes and ensuring directory links end with a slash, while leaving external links unchanged
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

  let normalizedPath = path.replace(/index\.html$/i, '');
  if (!normalizedPath) {
    normalizedPath = './';
  }

  return `${normalizedPath}${query}${hash}`;
}

// Normalize the current URL in the address bar by removing "index.html" suffixes, so that links to the same page are consistent and don't cause unnecessary reloads
function normalizeCurrentUrl() {
  if (window.location.protocol === 'file:') return;

  const pathname = window.location.pathname;
  if (!/index\.html$/i.test(pathname)) return;

  const normalizedPathname = pathname.replace(/index\.html$/i, '') || '/';
  const nextUrl = `${normalizedPathname}${window.location.search}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}
// Normalize all links in the document to ensure they are consistent and don't cause unnecessary reloads when clicked, by removing "index.html" suffixes from internal links while leaving external links unchanged
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

// Render a navigation link with the "active" class if it's the current section
// (for example <a href="/en/sections/sources/" class="active">Technological sources</a>)
function renderNavLink(href, label, isActive) {
  return `<a${isActive ? ' class="active"' : ''} href="${href}">${label}</a>`;
}

// Build the header HTML based on the current language and section, including the logo, contact info, language switcher, navigation links, and search form
function buildHeader() {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const base = getRootPrefix();
  const localPath = getLocalPathFromRoot();
  const section = getSectionFromPath(localPath, lang);
  const isEn = lang === 'en';

  const home = isEn ? withBase(base, 'en/') : withBase(base, '');
  const sources = isEn ? withBase(base, 'en/sections/sources/') : withBase(base, 'sections/sources/');
  const services = isEn ? withBase(base, 'en/sections/services/') : withBase(base, 'sections/services/');
  const projects = isEn ? withBase(base, 'en/sections/projects/') : withBase(base, 'sections/projects/');
  const blog = isEn ? withBase(base, 'en/sections/blog/') : withBase(base, 'sections/blog/');
  const contacts = isEn ? withBase(base, 'en/sections/contacts/') : withBase(base, 'sections/contacts/');

  const languageSwitchHref = `${base}${getLanguageSwitchPath(localPath, lang)}`;
  const searchPlaceholder = isEn ? 'Search...' : 'Поиск...';
  const searchAria = isEn ? 'Search' : 'Найти';
  const menuAria = isEn ? 'Main menu' : 'Главное меню';
  const languageAria = isEn ? 'Language switch' : 'Переключение языка';
  const burgerAria = isEn ? 'Open menu' : 'Открыть меню';
  const brandTitle = isEn ? 'IVC PLASMAINSTRUMENT' : 'ИВЦ ПЛАЗМАИНСТРУМЕНТ';
  const brandSubtitle = isEn ? 'Vacuum technologies' : 'Вакуумные технологии';
  const logoSrc = `${base}images/logo.jpg`;

  return `<header class="header">
    <div class="header-top">
      <div class="container header-top__wrap">
        <a class="brand" href="${home}"><img class="brand-logo" src="${logoSrc}" alt="${brandTitle}" /><span><strong>${brandTitle}</strong><small>${brandSubtitle}</small></span></a>
        <div class="header-contacts">
          <a href="tel:+79600851803">+7(960)0851803</a>
          <a href="mailto:info@plasma-instrument.com">info@plasma-instrument.com</a>
        </div>
        <div class="header-top__right">
          <div class="lang-switch" aria-label="${languageAria}">${isEn ? `<a href="${languageSwitchHref}">RU</a><span class="active">EN</span>` : `<span class="active">RU</span><a href="${languageSwitchHref}">EN</a>`}</div>
          <button class="nav-toggle" aria-label="${burgerAria}" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div>
    </div>
    <div class="header-nav">
      <div class="container header-nav__wrap">
        <nav class="nav" aria-label="${menuAria}">
          ${renderNavLink(home, isEn ? 'Home' : 'Главная', section === 'home')}
          ${renderNavLink(sources, isEn ? 'Technological sources' : 'Технологические источники', section === 'sources')}
          ${renderNavLink(services, isEn ? 'Services' : 'Услуги', section === 'services')}
          ${renderNavLink(projects, isEn ? 'Investment and scientific projects' : 'Инвестиционные и научные проекты', section === 'projects')}
          ${renderNavLink(blog, isEn ? 'Blog' : 'Блог', section === 'blog')}
          ${renderNavLink(contacts, isEn ? 'Contacts' : 'Контакты', section === 'contacts')}
        </nav>
        <form class="search-form" role="search">
          <input class="search-input" type="search" name="q" placeholder="${searchPlaceholder}" autocomplete="off">
          <button class="search-btn" type="submit" aria-label="${searchAria}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
        </form>
      </div>
    </div>
  </header>`;
}

// Build the footer HTML based on the current language, including the company info, navigation links, contact info, and copyright notice
function buildFooter() {
  const isEn = document.documentElement.lang === 'en';
  const base = getRootPrefix();
  const currentYear = new Date().getFullYear();
  const home = isEn ? withBase(base, 'en/') : withBase(base, '');
  const sources = isEn ? withBase(base, 'en/sections/sources/') : withBase(base, 'sections/sources/');
  const services = isEn ? withBase(base, 'en/sections/services/') : withBase(base, 'sections/services/');
  const projects = isEn ? withBase(base, 'en/sections/projects/') : withBase(base, 'sections/projects/');
  const blog = isEn ? withBase(base, 'en/sections/blog/') : withBase(base, 'sections/blog/');
  const contacts = isEn ? withBase(base, 'en/sections/contacts/') : withBase(base, 'sections/contacts/');

  const brand = isEn ? 'IVC PLASMAINSTRUMENT' : 'ИВЦ ПЛАЗМАИНСТРУМЕНТ';
  const address = isEn ? '420087, Kazan, Daurskaya 41, office 7' : '420087, РТ, г. Казань, ул. Даурская 41, оф. 7';
  const menuTitle = isEn ? 'Menu' : 'Разделы';
  const contactsTitle = isEn ? 'Contacts' : 'Контакты';
  const whatsappLabel = isEn ? 'Write to WhatsApp' : 'Написать в WhatsApp';
  const logoSrc = `${base}images/logo.jpg`;

  return `<footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col footer-col--brand">
        <h3 class="footer-brand"><img class="footer-brand__logo" src="${logoSrc}" alt="${brand}" /><span>${brand}</span></h3>
        <p>${address}</p>
      </div>
      <div class="footer-col footer-col--menu">
        <h3>${menuTitle}</h3>
        <ul>
          <li><a href="${home}">${isEn ? 'Home' : 'Главная'}</a></li>
          <li><a href="${sources}">${isEn ? 'Technological sources' : 'Технологические источники'}</a></li>
          <li><a href="${services}">${isEn ? 'Services' : 'Услуги'}</a></li>
          <li><a href="${projects}">${isEn ? 'Investment and scientific projects' : 'Инвестиционные и научные проекты'}</a></li>
          <li><a href="${blog}">${isEn ? 'Blog' : 'Блог'}</a></li>
          <li><a href="${contacts}">${isEn ? 'Contacts' : 'Контакты'}</a></li>
        </ul>
      </div>
      <div class="footer-col footer-col--contacts">
        <h3>${contactsTitle}</h3>
        <p><a href="tel:+79600851803">+7(960)0851803</a></p>
        <p><a href="mailto:info@plasma-instrument.com">info@plasma-instrument.com</a></p>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>Copyright. 2018 - ${currentYear}</p>
    </div>
  </footer>`;
}

// Render the header and footer, normalize the current URL and all document links to ensure consistency and prevent unnecessary reloads when navigating, by removing "index.html" suffixes from internal links while leaving external links unchanged
function mountLayout() {
  normalizeCurrentUrl();
  normalizeDocumentLinks();

  const headerSlot = document.querySelector('[data-site-header]');
  const footerSlot = document.querySelector('[data-site-footer]');

  if (headerSlot) {
    headerSlot.outerHTML = buildHeader();
  }

  if (footerSlot) {
    footerSlot.outerHTML = buildFooter();
  }
}

mountLayout();