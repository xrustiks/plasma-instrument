/**
 * Модуль для инициализации и управления ленивой загрузкой изображений.
 * 
 * Использует нативное `loading="lazy"` атрибут для современных браузеров.
 * Для старых браузеров предусмотрен Intersection Observer API для полифилла.
 * 
 * Возможности:
 * - Автоматический Intersection Observer для браузеров без поддержки loading="lazy"
 * - Опциональная обработка ошибок загрузки
 * - Кэширование уже инициализированных элементов
 */

/**
 * Инициализирует ленивую загрузку для изображений на странице.
 * Для современных браузеров нативное `loading="lazy"` достаточно.
 * Для старых браузеров используется Intersection Observer.
 */
export function initLazyLoad() {
  // Проверяем поддержку нативного lazy loading
  if ('loading' in HTMLImageElement.prototype) {
    // Нативная поддержка есть, ничего не нужно делать
    // loading="lazy" будет работать автоматически
    return;
  }

  // Для старых браузеров используем Intersection Observer
  if ('IntersectionObserver' in window) {
    initIntersectionObserverPolyfill();
  }
}

/**
 * Инициализирует Intersection Observer для поддержки ленивой загрузки в старых браузерах.
 * Это работает для изображений с `loading="lazy"` атрибутом.
 */
function initIntersectionObserverPolyfill() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const img = entry.target;
      
      // Перемещаем src в src, если он был в data-src (для совместимости)
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }

      // Добавляем класс для опциональной CSS анимации при загрузке
      img.classList.add('lazy-loaded');
      
      // Прекращаем наблюдение за этим элементом
      observer.unobserve(img);
    });
  }, {
    // Начинаем загрузку за 50px до входа в видимую область
    rootMargin: '50px'
  });

  // Наблюдаем за всеми изображениями с loading="lazy"
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Добавляет обработчик ошибки загрузки для изображений.
 * Опционально может показать плейсхолдер или скрыть изображение при ошибке.
 */
export function initImageErrorHandling() {
  document.addEventListener('error', (event) => {
    if (event.target.tagName === 'IMG') {
      const img = event.target;
      
      // Добавляем класс для стилизации ошибок в CSS
      img.classList.add('image-error');
      
      // Опционально: добавляем alt текст об ошибке
      if (!img.dataset.errorHandled) {
        const alt = img.getAttribute('alt');
        img.setAttribute('alt', alt ? `${alt} (не загружено)` : 'Изображение не загружено');
        img.dataset.errorHandled = 'true';
      }
    }
  }, true);
}
