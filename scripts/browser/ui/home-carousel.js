// Initializes carousel
export function initHomeCarousel() {
  const carousel = document.querySelector('[data-carousel]');

  if (!carousel) {
    return;
  }

  const slides = [...carousel.querySelectorAll('.slide')];
  const dots = [...carousel.querySelectorAll('.slider-dots button')];

  if (!slides.length || !dots.length) {
    return;
  }

  let current = 0;
  let timerId;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  };

  const startAutoPlay = () => {
    timerId = window.setInterval(() => showSlide(current + 1), 5000);
  };

  const restartAutoPlay = () => {
    window.clearInterval(timerId);
    startAutoPlay();
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      restartAutoPlay();
    });
  });

  showSlide(0);
  startAutoPlay();
}