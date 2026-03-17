// Initializes reveal on scroll animations for elements with the 'reveal' class
export function initRevealOnScroll() {
  const revealItems = document.querySelectorAll('.reveal');

  if (!revealItems.length) {
    return;
  }

  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  const revealImmediately = () => {
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
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
    { threshold: 0.01 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;

    if (isInViewport(item)) {
      item.classList.add('is-visible');
      return;
    }

    observer.observe(item);
  });
}