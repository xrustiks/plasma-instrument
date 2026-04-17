/**
 * Initialize contacts modal functionality
 */
export function initContactsModal() {
  const modal = document.getElementById('contactsModal');
  const openButton = document.getElementById('openContactsModal');
  const closeButton = document.getElementById('closeContactsModal');

  if (!modal || !openButton || !closeButton) {
    console.warn('Contacts modal elements not found');
    return;
  }

  // Open modal when button is clicked
  openButton.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // Close modal when close button is clicked
  closeButton.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Close modal when clicking outside of modal content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Close modal when clicking on contact links (they will handle navigation)
  const contactLinks = modal.querySelectorAll('.contact-link');
  contactLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Don't close immediately for tel: and mailto: links, let them handle naturally
      if (!link.href.startsWith('tel:') && !link.href.startsWith('mailto:')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}
