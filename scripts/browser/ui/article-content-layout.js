// Makes wide article tables horizontally scrollable and turns standalone diagrams into clickable images.
export function initArticleContentLayout() {
  const articleBlocks = document.querySelectorAll('.article-content');

  if (!articleBlocks.length) {
    return;
  }

  articleBlocks.forEach((block) => {
    const isEn = document.documentElement.lang === 'en';
    const imageHint = isEn ? 'Open image in a new tab' : 'Открыть изображение в новой вкладке';

    const tables = block.querySelectorAll('table');
    tables.forEach((table) => {
      if (table.closest('.table-scroll')) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    const images = block.querySelectorAll('img');
    images.forEach((image) => {
      if (image.closest('.article-gallery')) {
        return;
      }

      if (image.closest('a') || image.closest('table')) {
        return;
      }

      image.classList.add('article-inline-image');

      const link = document.createElement('a');
      link.className = 'article-inline-image-link';
      link.href = image.currentSrc || image.src;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = imageHint;
      link.setAttribute('aria-label', imageHint);

      image.parentNode.insertBefore(link, image);
      link.appendChild(image);
    });
  });
}
