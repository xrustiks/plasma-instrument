import { initArticleGalleryLightbox } from './ui/article-gallery-lightbox.js';
import { initArticleContentLayout } from './ui/article-content-layout.js';
import { initClickableCardLinks } from './ui/clickable-card-links.js';
import { initHomeCarousel } from './ui/home-carousel.js';
import { initNavigationMenu } from './ui/navigation-menu.js';
import { initRevealOnScroll } from './ui/reveal-on-scroll.js';
import { initSearchForm } from './search/search-form.js';
import { initSearchResults } from './search/search-results.js';
import { initTestimonialLightbox } from './ui/testimonial-lightbox.js';
import { initContactsModal } from './ui/contacts-modal.js';
import { initCmsContent } from './cms-content.js';
import { layoutReady } from './render-site-layout.js';

// Initialize all UI components and features when the DOM is fully loaded
Promise.resolve(layoutReady).finally(() => {
	initNavigationMenu();
	initRevealOnScroll();
	initHomeCarousel();
	initClickableCardLinks();
	initArticleContentLayout();
	initArticleGalleryLightbox();
	initTestimonialLightbox();
	initContactsModal();
	initSearchForm();
	initSearchResults();
	initCmsContent();
});