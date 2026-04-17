import { Router } from 'express';
import articlesRoutes from './articles-routes.js';
import healthRoutes from './health-routes.js';
import sectionsRoutes from './sections-routes.js';

const router = Router();

router.use('/sections', sectionsRoutes);
router.use('/articles', articlesRoutes);
router.use('/health', healthRoutes);

export default router;