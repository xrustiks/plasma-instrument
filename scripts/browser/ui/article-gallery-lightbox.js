// Initializes article gallery
export function initArticleGalleryLightbox() {
  const galleries = document.querySelectorAll('.article-gallery');

  if (!galleries.length) {
    return;
  }

  const isEn = document.documentElement.lang === 'en';
  const modal = document.createElement('div');
  modal.className = 'lightbox';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <button class="lightbox__close" type="button" aria-label="${isEn ? 'Close' : 'Закрыть'}">×</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="${isEn ? 'Previous' : 'Предыдущее'}">‹</button>
    <img class="lightbox__img" alt="" />
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="${isEn ? 'Next' : 'Следующее'}">›</button>
  `;
  document.body.appendChild(modal);

  const closeButton = modal.querySelector('.lightbox__close');
  const previousButton = modal.querySelector('.lightbox__nav--prev');
  const nextButton = modal.querySelector('.lightbox__nav--next');
  const modalImage = modal.querySelector('.lightbox__img');

  let items = [];
  let currentIndex = 0;

  const setImage = (index) => {
    if (!items.length) {
      return;
    }

    currentIndex = (index + items.length) % items.length;
    const link = items[currentIndex];
    const image = link.querySelector('img');
    modalImage.src = link.getAttribute('href') || image?.src || '';
    modalImage.alt = image?.alt || '';
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
    modalImage.src = '';
  };

  galleries.forEach((gallery) => {
    const links = [...gallery.querySelectorAll('a[href]')];

    links.forEach((link, index) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        open(links, index);
      });
    });
  });

  closeButton.addEventListener('click', close);
  previousButton.addEventListener('click', () => setImage(currentIndex - 1));
  nextButton.addEventListener('click', () => setImage(currentIndex + 1));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) {
      return;
    }

    if (event.key === 'Escape') {
      close();
    }
    if (event.key === 'ArrowLeft') {
      setImage(currentIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      setImage(currentIndex + 1);
    }
  });
}