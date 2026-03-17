// Initializes the navigation menu
export function initNavigationMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (!nav) {
    return;
  }

  const closeAriaLabel = document.documentElement.lang === 'en' ? 'Close menu' : 'Закрыть меню';
  let navClose = nav.querySelector('.nav-close');

  if (!navClose) {
    navClose = document.createElement('button');
    navClose.type = 'button';
    navClose.className = 'nav-close';
    navClose.setAttribute('aria-label', closeAriaLabel);
    navClose.textContent = '×';
    nav.prepend(navClose);
  }

  const closeNavMenu = () => {
    nav.classList.remove('open');
    document.body.classList.remove('nav-overlay-open');

    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
  };

  const openNavMenu = () => {
    nav.classList.add('open');
    document.body.classList.add('nav-overlay-open');

    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'true');
    }
  };

  const header = document.querySelector('.header');
  const navWrap = document.querySelector('.header-nav__wrap');

  if (navToggle && navWrap) {
    navWrap.insertBefore(navToggle, navWrap.firstChild);
  }

  if (header && navWrap) {
    const checkCompact = () => {
      const forceCompact = window.matchMedia('(max-width: 988px)').matches;
      const wasCompact = header.classList.contains('is-compact');

      if (forceCompact) {
        if (!wasCompact) {
          header.classList.add('is-compact');
        }
        return;
      }

      if (wasCompact) {
        header.classList.remove('is-compact');
      }

      const overflows = navWrap.scrollWidth > navWrap.clientWidth + 2;
      header.classList.toggle('is-compact', overflows);

      if (wasCompact && !overflows) {
        closeNavMenu();
      }
    };

    if ('ResizeObserver' in window) {
      new ResizeObserver(checkCompact).observe(navWrap);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkCompact);
    }

    window.addEventListener('resize', checkCompact);
    checkCompact();
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      if (nav.classList.contains('open')) {
        closeNavMenu();
      } else {
        openNavMenu();
      }
    });
  }

  navClose.addEventListener('click', closeNavMenu);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeNavMenu();
    }
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNavMenu);
  });
}