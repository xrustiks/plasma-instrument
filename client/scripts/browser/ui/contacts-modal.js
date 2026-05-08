/**
 * Initialize contacts modal functionality
 */
export function initContactsModal() {
  const modal = document.getElementById('contactsModal');
  const openButton = document.getElementById('openContactsModal');
  const closeButton = document.getElementById('closeContactsModal');
  const root = document.documentElement;

  if (!modal || !openButton || !closeButton) {
    console.warn('Contacts modal elements not found');
    return;
  }

  const openModal = () => {
    modal.classList.add('active');
    root.classList.add('modal-open');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    modal.classList.remove('active');
    root.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  };

  // Open modal when button is clicked
  openButton.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  // Close modal when close button is clicked
  closeButton.addEventListener('click', () => {
    closeModal();
  });

  // Close modal when clicking outside of modal content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Close modal when clicking on contact links (they will handle navigation)
  const contactLinks = modal.querySelectorAll('.contact-link');
  contactLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href') || '';
      // Don't close immediately for tel: and mailto: links, let them handle naturally
      if (!href.startsWith('tel:') && !href.startsWith('mailto:')) {
        closeModal();
      }
    });
  });
}
