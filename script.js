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
  const isInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.01 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    // Ensure long sections are visible on first paint without waiting for scroll.
    if (isInViewport(item)) {
      item.classList.add('is-visible');
      return;
    }
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
// Article gallery lightbox
// =============================================================================
(() => {
  const galleries = document.querySelectorAll('.article-gallery');
  if (!galleries.length) return;

  const modal = document.createElement('div');
  modal.className = 'lightbox';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <button class="lightbox__close" type="button" aria-label="Close">×</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous">‹</button>
    <img class="lightbox__img" alt="" />
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next">›</button>
  `;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.lightbox__close');
  const prevBtn = modal.querySelector('.lightbox__nav--prev');
  const nextBtn = modal.querySelector('.lightbox__nav--next');
  const modalImg = modal.querySelector('.lightbox__img');

  let items = [];
  let index = 0;

  const setImage = (i) => {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    const link = items[index];
    const img = link.querySelector('img');
    modalImg.src = link.getAttribute('href') || img?.src || '';
    modalImg.alt = img?.alt || '';
  };

  const open = (galleryLinks, startIndex) => {
    items = galleryLinks;
    setImage(startIndex);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    modalImg.src = '';
  };

  galleries.forEach((gallery) => {
    const links = [...gallery.querySelectorAll('a[href]')];
    links.forEach((link, i) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        open(links, i);
      });
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => setImage(index - 1));
  nextBtn.addEventListener('click', () => setImage(index + 1));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') setImage(index - 1);
    if (event.key === 'ArrowRight') setImage(index + 1);
  });
})();

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
const getSearchIndexPath = () => {
  const depth = parseInt(document.documentElement.dataset.depth || '0', 10);
  const safeDepth = Number.isNaN(depth) ? 0 : Math.max(0, depth);
  return '../'.repeat(safeDepth) + 'search-index.json';
};

const loadSearchIndex = async () => {
  const response = await fetch(getSearchIndexPath(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Search index request failed: ${response.status}`);
  }
  return response.json();
};

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderGroupedHits = (hits, sections, sectionTitlePrefix) => sections
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
              <a href="${hit.url}">${hit.title}</a>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  })
  .filter(Boolean)
  .join('');

const resultsEl = document.getElementById('search-results');
if (resultsEl) {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const queryInput = document.getElementById('search-query');
    if (queryInput) queryInput.value = q;

    if (!q.trim()) {
      return;
    }

    const isEn = (document.documentElement.lang || 'ru') === 'en';
    const sectionTitlePrefix = isEn ? 'Section' : 'Раздел';

    try {
      const payload = await loadSearchIndex();
      const data = isEn ? payload.en : payload.ru;
      const index = Array.isArray(data?.entries) ? data.entries : [];
      const sections = Array.isArray(data?.sections) ? data.sections : [];

      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = index.filter(({ title, body }) => {
        const hay = `${title || ''} ${body || ''}`.toLowerCase();
        return terms.some((t) => hay.includes(t));
      });

      if (hits.length) {
        resultsEl.innerHTML = renderGroupedHits(hits, sections, sectionTitlePrefix);
      } else {
        const msg = isEn
          ? `Nothing found for «${escapeHtml(q)}».`
          : `Ничего не найдено по запросу «${escapeHtml(q)}».`;
        resultsEl.innerHTML = `<p class="search-empty">${msg}</p>`;
      }
    } catch (error) {
      const msg = isEn
        ? 'Search index is unavailable. Please try again later.'
        : 'Поисковый индекс недоступен. Повторите попытку позже.';
      resultsEl.innerHTML = `<p class="search-empty">${msg}</p>`;
      console.error(error);
    }
  })();
}
