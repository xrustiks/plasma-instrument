import { Router } from 'express';
import articlesRoutes from './articles-routes.js';
import healthRoutes from './health-routes.js';
import sectionsRoutes from './sections-routes.js';
import uploadRoutes from './upload-routes.js';

const router = Router();

router.use('/sections', sectionsRoutes);
router.use('/articles', articlesRoutes);
router.use('/health', healthRoutes);
router.use('/upload', uploadRoutes);

export default router;