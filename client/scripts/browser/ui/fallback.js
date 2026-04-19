/**
 * Модуль для управления fallback UI состояниями:
 * - Skeleton loaders при загрузке
 * - Error states при ошибках
 * - No-script fallback
 */

/**
 * Показывает skeleton loader для карточек статей
 * @param {Element} container - контейнер для вставки skeletons
 * @param {number} count - количество skeleton элементов
 */
export function showSkeletonCards(container, count = 6) {
  if (!container) return;

  const html = Array(count)
    .fill(0)
    .map(
      () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 70%;"></div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
}

/**
 * Показывает сообщение об ошибке в контейнере
 * @param {Element} container - контейнер для вставки ошибки
 * @param {string} lang - язык ('ru' или 'en')
 */
export function showErrorMessage(container, lang = 'ru') {
  if (!container) return;

  const messages = {
    ru: {
      title: 'Ошибка загрузки',
      text: 'Не удалось загрузить контент. Пожалуйста, обновите страницу.'
    },
    en: {
      title: 'Load Error',
      text: 'Failed to load content. Please refresh the page.'
    }
  };

  const msg = messages[lang] || messages.ru;

  container.innerHTML = `
    <div class="error-message">
      <p class="error-title">${msg.title}</p>
      <p class="error-text">${msg.text}</p>
      <button class="error-retry-btn" onclick="location.reload()">
        ${lang === 'ru' ? 'Обновить страницу' : 'Refresh Page'}
      </button>
    </div>
  `;
}

/**
 * Показывает пустое состояние (нет контента)
 * @param {Element} container - контейнер для вставки
 * @param {string} lang - язык ('ru' или 'en')
 */
export function showEmptyState(container, lang = 'ru') {
  if (!container) return;

  const messages = {
    ru: {
      title: 'Контент не найден',
      text: 'В этом разделе пока нет статей.'
    },
    en: {
      title: 'No Content',
      text: 'No articles in this section yet.'
    }
  };

  const msg = messages[lang] || messages.ru;

  container.innerHTML = `
    <div class="empty-state">
      <p class="empty-title">${msg.title}</p>
      <p class="empty-text">${msg.text}</p>
    </div>
  `;
}

/**
 * Удаляет skeleton loaders из контейнера
 * @param {Element} container - контейнер
 */
export function removeSkeletons(container) {
  if (!container) return;

  const skeletons = container.querySelectorAll('.skeleton-card');
  skeletons.forEach((el) => el.remove());
}
