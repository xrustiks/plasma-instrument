// Initializes carousel
export function initHomeCarousel() {
  const carousels = [...document.querySelectorAll('[data-carousel]')];

  if (!carousels.length) {
    return;
  }

  carousels.forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('.slide')];
    const dots = [...carousel.querySelectorAll('.slider-dots button')];
    const prevBtn = carousel.querySelector('.slider-nav--prev');
    const nextBtn = carousel.querySelector('.slider-nav--next');

    if (!slides.length) {
      return;
    }

    let current = 0;
    let timerId;

    const showSlide = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      if (dots.length) {
        dots.forEach((dot, dotIndex) => {
          dot.classList.toggle('is-active', dotIndex === current);
        });
      }
    };

    const startAutoPlay = () => {
      timerId = window.setInterval(() => showSlide(current + 1), 5000);
    };

    const restartAutoPlay = () => {
      window.clearInterval(timerId);
      startAutoPlay();
    };

    if (dots.length) {
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          showSlide(index);
          restartAutoPlay();
        });
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(current - 1);
        restartAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        showSlide(current + 1);
        restartAutoPlay();
      });
    }

    showSlide(0);
    startAutoPlay();
  });
}