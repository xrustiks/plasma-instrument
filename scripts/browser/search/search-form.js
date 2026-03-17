import { getSearchPagePath } from './search-shared.js';

export function initSearchForm() {
  document.querySelectorAll('.search-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const input = form.querySelector('.search-input');
      const query = (input?.value || '').trim();

      if (!query) {
        return;
      }

      window.location.href = `${getSearchPagePath()}?q=${encodeURIComponent(query)}`;
    });
  });
}