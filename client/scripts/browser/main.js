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
import { initLazyLoad, initImageErrorHandling } from './ui/lazy-load.js';

// Инициализация всех компонентов и функциональностей сайта после того, как макет будет готов. 
// Используем Promise.resolve для обеспечения последовательности выполнения, 
// даже если layoutReady уже завершился
Promise.resolve(layoutReady).finally(() => {
	initLazyLoad();
	initImageErrorHandling();
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