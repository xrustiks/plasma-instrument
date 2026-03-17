import { initAccordionGroups } from './ui/accordion-groups.js';
import { initArticleGalleryLightbox } from './ui/article-gallery-lightbox.js';
import { initClickableCardLinks } from './ui/clickable-card-links.js';
import { initHomeCarousel } from './ui/home-carousel.js';
import { initNavigationMenu } from './ui/navigation-menu.js';
import { initRevealOnScroll } from './ui/reveal-on-scroll.js';
import { initSearchForm } from './search/search-form.js';
import { initSearchResults } from './search/search-results.js';

// Initialize all UI components and features when the DOM is fully loaded
initNavigationMenu();
initRevealOnScroll();
initHomeCarousel();
initAccordionGroups();
initClickableCardLinks();
initArticleGalleryLightbox();
initSearchForm();
initSearchResults();