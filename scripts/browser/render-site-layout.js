// Rendering the site header and footer based on the current page context (language, section, etc.)
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

function getSectionFromPath(localPath, lang) {
  const normalized = lang === 'en' ? localPath.replace(/^en\//, '') : localPath;

  if (normalized === 'index.html') return 'home';
  if (normalized.startsWith('sections/sources/')) return 'sources';
  if (normalized.startsWith('sections/services/')) return 'services';
  if (normalized.startsWith('sections/projects/')) return 'projects';
  if (normalized.startsWith('sections/blog/')) return 'blog';
  if (normalized.startsWith('sections/contacts/')) return 'contacts';
  return '';
}

function getLanguageSwitchPath(localPath, lang) {
  if (lang === 'en') {
    return localPath.replace(/^en\//, '');
  }

  return `en/${localPath}`;
}

function renderNavLink(href, label, isActive) {
  return `<a${isActive ? ' class="active"' : ''} href="${href}">${label}</a>`;
}

function buildHeader() {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const base = getRootPrefix();
  const localPath = getLocalPathFromRoot();
  const section = getSectionFromPath(localPath, lang);
  const isEn = lang === 'en';

  const home = isEn ? `${base}en/index.html` : `${base}index.html`;
  const sources = isEn ? `${base}en/sections/sources/index.html` : `${base}sections/sources/index.html`;
  const services = isEn ? `${base}en/sections/services/index.html` : `${base}sections/services/index.html`;
  const projects = isEn ? `${base}en/sections/projects/index.html` : `${base}sections/projects/index.html`;
  const blog = isEn ? `${base}en/sections/blog/index.html` : `${base}sections/blog/index.html`;
  const contacts = isEn ? `${base}en/sections/contacts/index.html` : `${base}sections/contacts/index.html`;

  const languageSwitchHref = `${base}${getLanguageSwitchPath(localPath, lang)}`;
  const searchPlaceholder = isEn ? 'Search...' : 'Поиск...';
  const searchAria = isEn ? 'Search' : 'Найти';
  const menuAria = isEn ? 'Main menu' : 'Главное меню';
  const languageAria = isEn ? 'Language switch' : 'Переключение языка';
  const burgerAria = isEn ? 'Open menu' : 'Открыть меню';
  const brandTitle = isEn ? 'IVC PLASMAINSTRUMENT' : 'ИВЦ ПЛАЗМАИНСТРУМЕНТ';
  const brandSubtitle = isEn ? 'Vacuum technologies' : 'Вакуумные технологии';

  return `<header class="header">
    <div class="header-top">
      <div class="container header-top__wrap">
        <a class="brand" href="${home}"><span class="brand-mark"></span><span><strong>${brandTitle}</strong><small>${brandSubtitle}</small></span></a>
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

function buildFooter() {
  const isEn = document.documentElement.lang === 'en';
  const text = isEn ? '© 2026 IVC PLASMAINSTRUMENT' : '© 2026 ИВЦ ПЛАЗМАИНСТРУМЕНТ';
  return `<footer class="footer"><div class="container footer-bottom"><p>${text}</p></div></footer>`;
}

function mountLayout() {
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