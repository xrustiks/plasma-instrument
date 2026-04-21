import { Router } from 'express';
import articlesRoutes from './articles-routes.js';
import healthRoutes from './health-routes.js';
import homeContentRoutes from './home-content-routes.js';
import sectionsRoutes from './sections-routes.js';
import uploadRoutes from './upload-routes.js';

const router = Router();

router.get('/', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Plasma Instrument API',
		routes: {
			health: '/api/health',
			homeContent: '/api/home-content',
			sections: '/api/sections',
			articles: '/api/articles',
			upload: '/api/upload'
		}
	});
});

router.use('/home-content', homeContentRoutes);
router.use('/sections', sectionsRoutes);
router.use('/articles', articlesRoutes);
router.use('/health', healthRoutes);
router.use('/upload', uploadRoutes);

export default router;