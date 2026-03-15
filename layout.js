(function () {
  function getDepth() {
    const raw = document.documentElement.dataset.depth || '0';
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  }

  function rootPrefix() {
    return '../'.repeat(getDepth());
  }

  function localPathFromRoot() {
    const depth = getDepth();
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.slice(-(depth + 1)).join('/');
  }

  function sectionFromPath(localPath, lang) {
    const normalized = lang === 'en' ? localPath.replace(/^en\//, '') : localPath;

    if (normalized === 'index.html') return 'home';
    if (normalized.startsWith('istos/')) return 'istos';
    if (normalized.startsWith('services/')) return 'services';
    if (normalized.startsWith('invprojects/')) return 'invprojects';
    if (normalized.startsWith('blog/')) return 'blog';
    if (normalized.startsWith('contacts/')) return 'contacts';
    return '';
  }

  function langSwitchPath(localPath, lang) {
    if (lang === 'en') {
      return localPath.replace(/^en\//, '');
    }
    return 'en/' + localPath;
  }

  function navLink(href, label, active) {
    return `<a${active ? ' class="active"' : ''} href="${href}">${label}</a>`;
  }

  function buildHeader() {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
    const base = rootPrefix();
    const localPath = localPathFromRoot();
    const section = sectionFromPath(localPath, lang);

    const isEn = lang === 'en';
    const home = isEn ? `${base}en/index.html` : `${base}index.html`;
    const istos = isEn ? `${base}en/istos/index.html` : `${base}istos/index.html`;
    const services = isEn ? `${base}en/services/index.html` : `${base}services/index.html`;
    const inv = isEn ? `${base}en/invprojects/index.html` : `${base}invprojects/index.html`;
    const blog = isEn ? `${base}en/blog/index.html` : `${base}blog/index.html`;
    const contacts = isEn ? `${base}en/contacts/index.html` : `${base}contacts/index.html`;

    const switchHref = `${base}${langSwitchPath(localPath, lang)}`;
    const searchPlaceholder = isEn ? 'Search...' : 'Поиск...';
    const searchAria = isEn ? 'Search' : 'Найти';
    const menuAria = isEn ? 'Main menu' : 'Главное меню';
    const langAria = isEn ? 'Language switch' : 'Переключение языка';
    const burgerAria = isEn ? 'Open menu' : 'Открыть меню';

    const brandTitle = isEn ? 'IVC PLASMAINSTRUMENT' : 'ИВЦ ПЛАЗМАИНСТРУМЕНТ';
    const brandSub = isEn ? 'Vacuum technologies' : 'Вакуумные технологии';

    return `<header class="header">
      <div class="header-top">
        <div class="container header-top__wrap">
          <a class="brand" href="${home}"><span class="brand-mark"></span><span><strong>${brandTitle}</strong><small>${brandSub}</small></span></a>
          <div class="header-contacts">
            <a href="tel:+79600851803">+7(960)0851803</a>
            <a href="mailto:info@plasma-instrument.com">info@plasma-instrument.com</a>
          </div>
          <div class="header-top__right">
            <div class="lang-switch" aria-label="${langAria}">${isEn ? `<a href="${switchHref}">RU</a><span class="active">EN</span>` : `<span class="active">RU</span><a href="${switchHref}">EN</a>`}</div>
            <button class="nav-toggle" aria-label="${burgerAria}" aria-expanded="false"><span></span><span></span></button>
          </div>
        </div>
      </div>
      <div class="header-nav">
        <div class="container header-nav__wrap">
          <nav class="nav" aria-label="${menuAria}">
            ${navLink(home, isEn ? 'Home' : 'Главная', section === 'home')}
            ${navLink(istos, isEn ? 'Technological sources' : 'Технологические источники', section === 'istos')}
            ${navLink(services, isEn ? 'Services' : 'Услуги', section === 'services')}
            ${navLink(inv, isEn ? 'Investment and scientific projects' : 'Инвестиционные и научные проекты', section === 'invprojects')}
            ${navLink(blog, isEn ? 'Blog' : 'Блог', section === 'blog')}
            ${navLink(contacts, isEn ? 'Contacts' : 'Контакты', section === 'contacts')}
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
}());
