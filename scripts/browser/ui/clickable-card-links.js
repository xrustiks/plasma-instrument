// Clickable card links
export function initClickableCardLinks() {
  const clickableCards = document.querySelectorAll('[data-href]');

  clickableCards.forEach((card) => {
    const openCard = () => {
      const href = card.dataset.href;

      if (!href) {
        return;
      }

      window.location.href = href;
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input')) {
        return;
      }

      openCard();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });
}