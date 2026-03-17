// Accordion groups
export function initAccordionGroups() {
  const accordions = document.querySelectorAll('[data-accordion]');

  accordions.forEach((accordion) => {
    const items = accordion.querySelectorAll('.accordion-item');

    items.forEach((item) => {
      const header = item.querySelector('.accordion-header');

      if (!header) {
        return;
      }

      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        items.forEach((accordionItem) => accordionItem.classList.remove('is-open'));

        if (!isOpen) {
          item.classList.add('is-open');
        }
      });
    });
  });
}