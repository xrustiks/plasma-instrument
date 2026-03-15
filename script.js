const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
let navClose = null;

if (nav) {
  navClose = nav.querySelector('.nav-close');
  if (!navClose) {
    navClose = document.createElement('button');
    navClose.type = 'button';
    navClose.className = 'nav-close';
    navClose.setAttribute('aria-label', 'Закрыть меню');
    navClose.textContent = '×';
    nav.prepend(navClose);
  }
}

const closeNavMenu = () => {
  if (!nav) return;
  nav.classList.remove('open');
  document.body.classList.remove('nav-overlay-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
};

const openNavMenu = () => {
  if (!nav) return;
  nav.classList.add('open');
  document.body.classList.add('nav-overlay-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'true');
  }
};

(function () {
  const header = document.querySelector('.header');
  const navWrap = document.querySelector('.header-nav__wrap');

  // Keep burger in the navigation row instead of the top header row
  if (navToggle && navWrap) {
    navWrap.insertBefore(navToggle, navWrap.firstChild);
  }

  if (!header || !navWrap) {
    return;
  }

  const checkCompact = () => {
    const forceCompact = window.matchMedia('(max-width: 988px)').matches;
    const wasCompact = header.classList.contains('is-compact');

    // In forced compact range keep state stable to avoid resize flicker.
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

    if (wasCompact && !overflows && nav) {
      closeNavMenu();
    }
  };

  new ResizeObserver(checkCompact).observe(navWrap);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', checkCompact);
  }

  window.addEventListener('resize', checkCompact);
  checkCompact();
}());

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    if (nav.classList.contains('open')) {
      closeNavMenu();
    } else {
      openNavMenu();
    }
  });

  if (navClose) {
    navClose.addEventListener('click', closeNavMenu);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeNavMenu();
    }
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeNavMenu();
    });
  });
}

const revealItems = document.querySelectorAll('.reveal');

if (revealItems.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    observer.observe(item);
  });
}

const carousel = document.querySelector('[data-carousel]');

if (carousel) {
  const slides = [...carousel.querySelectorAll('.slide')];
  const dots = [...carousel.querySelectorAll('.slider-dots button')];
  let current = 0;
  let timer;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  };

  const start = () => {
    timer = setInterval(() => showSlide(current + 1), 5000);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      clearInterval(timer);
      start();
    });
  });

  showSlide(0);
  start();
}

const accordions = document.querySelectorAll('[data-accordion]');

accordions.forEach((accordion) => {
  const items = accordion.querySelectorAll('.accordion-item');

  items.forEach((item) => {
    const header = item.querySelector('.accordion-header');

    if (!header) {
      return;
    }

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach((one) => one.classList.remove('is-open'));
      if (!isOpen) {
        item.classList.add('is-open');
      }
    });
  });
});

const clickableCards = document.querySelectorAll('[data-href]');

clickableCards.forEach((card) => {
  const openCard = () => {
    const href = card.dataset.href;
    if (!href) return;
    window.location.href = href;
  };

  card.addEventListener('click', (event) => {
    if (event.target.closest('a, button, input')) {
      return;
    }
    openCard();
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCard();
    }
  });
});

// =============================================================================
// Search — form submit on any page
// =============================================================================
document.querySelectorAll('.search-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (form.querySelector('.search-input').value || '').trim();
    if (!q) return;
    const lang = document.documentElement.lang || 'ru';
    const depth = parseInt(document.documentElement.dataset.depth || '0', 10);
    let searchPage;
    if (lang === 'en') {
      // en/search.html — depth 1 = en/, depth 2 = en/sub/
      searchPage = '../'.repeat(depth - 1) + 'search.html';
    } else {
      searchPage = '../'.repeat(depth) + 'search.html';
    }
    window.location.href = searchPage + '?q=' + encodeURIComponent(q);
  });
});

// =============================================================================
// Search results page
// =============================================================================
const RU_INDEX = [
  { url: 'index.html',            title: 'О компании ООО ИВЦ Плазмаинструмент', body: 'ионно-плазменные источники магнетроны дуговые испарители вакуумные технологии НИР НИОКР Казань' },
  { url: 'istos/index.html',      title: 'Технологические источники',            body: 'ионнолучевые источники планарные магнетроны дуговые испарители нанесение покрытий вакуум разряд' },
  { url: 'services/index.html',   title: 'Услуги',                               body: 'экспорт вакуумного оборудования монтаж запуск нанесение покрытий механообработка модернизация НИОКР гальваника' },
  { url: 'invprojects/index.html',title: 'Инвестиционные и научные проекты',     body: 'декоративные покрытия керамическая плитка гальванические процессы листовой металл ВЧ ионный источник магнетрон фольга' },
  { url: 'blog/index.html',       title: 'Блог',                                 body: 'шпиндель пневматический диафрагма камера закалки анод MAP ролик реактор золото серебро вакуумный фильтр' },
  { url: 'contacts/index.html',   title: 'Контакты',                             body: 'Казань Даурская 41 офис телефон email адрес' },
];

const EN_INDEX = [
  { url: 'index.html',            title: 'About IVC PlasmaInstrument',                  body: 'ion plasma sources magnetrons arc evaporators vacuum technologies R&D Kazan thirty years' },
  { url: 'istos/index.html',      title: 'Technological sources',                        body: 'ion beam sources extended planar magnetrons arc evaporators coating vacuum discharge' },
  { url: 'services/index.html',   title: 'Services',                                     body: 'export vacuum equipment installation commissioning coating deposition machining modernization galvanic' },
  { url: 'invprojects/index.html',title: 'Investment and scientific projects',            body: 'decorative coatings ceramic tiles galvanic vacuum RF ion source magnetron foil carbon electrode' },
  { url: 'blog/index.html',       title: 'Blog',                                         body: 'spindle diaphragm hardening chamber anode MAP roller reactor gold silver vacuum filter' },
  { url: 'contacts/index.html',   title: 'Contacts',                                     body: 'Kazan Daurskaya 41 office phone email address' },
];

const resultsEl = document.getElementById('search-results');
if (resultsEl) {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const queryInput = document.getElementById('search-query');
  if (queryInput) queryInput.value = q;

  const isEn = (document.documentElement.lang || 'ru') === 'en';
  const index = isEn ? EN_INDEX : RU_INDEX;

  if (q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = index.filter(({ title, body }) => {
      const hay = (title + ' ' + body).toLowerCase();
      return terms.some((t) => hay.includes(t));
    });
    if (hits.length) {
      resultsEl.innerHTML = hits
        .map((h) => `<div class="search-result"><a href="${h.url}">${h.title}</a><p>${h.body.slice(0, 90)}…</p></div>`)
        .join('');
    } else {
      const msg = isEn
        ? `Nothing found for «${q}».`
        : `Ничего не найдено по запросу «${q}».`;
      resultsEl.innerHTML = `<p class="search-empty">${msg}</p>`;
    }
  }
}
