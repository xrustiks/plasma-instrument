// Initializes reveal on scroll animations for elements with the 'reveal' class
export function initRevealOnScroll() {
  const revealItems = document.querySelectorAll('.reveal');
  const isHomePage = Boolean(document.querySelector('main .main-focus'));

  if (!revealItems.length) {
    return;
  }

  if (isHomePage) {
    document.body.classList.add('home-expressive-reveal');

    const sectionStyles = [
      ['main-focus', 'zoom-up'],
      ['section-benefits', 'left'],
      ['section-testimonials', 'right'],
      ['cta', 'up-strong']
    ];

    let styledIndex = 0;
    revealItems.forEach((item) => {
      let style = styledIndex % 2 === 0 ? 'left' : 'right';

      for (let idx = 0; idx < sectionStyles.length; idx += 1) {
        const [className, classStyle] = sectionStyles[idx];
        if (item.classList.contains(className)) {
          style = classStyle;
          break;
        }
      }

      item.dataset.revealStyle = style;
      styledIndex += 1;
    });
  }

  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  const revealImmediately = () => {
    revealItems.forEach((item, index) => {
      const step = isHomePage ? 130 : 70;
      const maxDelay = isHomePage ? 620 : 280;
      item.style.transitionDelay = `${Math.min(index * step, maxDelay)}ms`;
      item.classList.add('is-visible');
    });
  };

  if (!('IntersectionObserver' in window)) {
    revealImmediately();
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    },
    isHomePage
      ? { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      : { threshold: 0.01 }
  );

  revealItems.forEach((item, index) => {
    const step = isHomePage ? 130 : 70;
    const maxDelay = isHomePage ? 620 : 280;
    item.style.transitionDelay = `${Math.min(index * step, maxDelay)}ms`;

    if (isInViewport(item)) {
      item.classList.add('is-visible');
      return;
    }

    observer.observe(item);
  });
}