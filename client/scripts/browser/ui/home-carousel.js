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
    let isHovering = false;
    let touchStartX = 0;
    let touchStartY = 0;

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
      if (isHovering) {
        return;
      }
      window.clearInterval(timerId);
      timerId = window.setInterval(() => showSlide(current + 1), 5000);
    };

    const stopAutoPlay = () => {
      window.clearInterval(timerId);
      timerId = undefined;
    };

    const restartAutoPlay = () => {
      if (isHovering) {
        return;
      }
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

    carousel.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.changedTouches?.[0];
        if (!touch) {
          return;
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );

    carousel.addEventListener(
      'touchend',
      (event) => {
        const touch = event.changedTouches?.[0];
        if (!touch) {
          return;
        }

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const horizontalThreshold = 40;

        if (Math.abs(deltaX) < horizontalThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
          return;
        }

        if (deltaX > 0) {
          showSlide(current - 1);
        } else {
          showSlide(current + 1);
        }
        restartAutoPlay();
      },
      { passive: true }
    );

    carousel.addEventListener('mouseenter', () => {
      isHovering = true;
      stopAutoPlay();
    });

    carousel.addEventListener('mouseleave', () => {
      isHovering = false;
      startAutoPlay();
    });

    showSlide(0);
    startAutoPlay();
  });
}