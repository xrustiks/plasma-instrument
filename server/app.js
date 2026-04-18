import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { API_PREFIX, PORT } from './config/constants.js';
import apiRoutes from './routes/router.js';
import { readArticles } from './storage/articles-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const clientRoot = path.resolve(__dirname, '..', 'client');

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'storage', 'uploads')));

app.use(API_PREFIX, apiRoutes);

// Backward compatibility for legacy static article URLs from old search index.
app.get(['/sections/:section/:slug/index.html', '/en/sections/:section/:slug/index.html'], async (req, res, next) => {
	try {
		const { section, slug } = req.params;
		const articles = await readArticles();
		const article = articles.find((item) => item.section === section && item.slug === slug);

		if (!article) {
			return next();
		}

		const isEn = req.path.startsWith('/en/');
		const targetPath = isEn ? '/en/article.html' : '/article.html';
		const query = new URLSearchParams({
			id: String(article.id),
			section
		});

		return res.redirect(`${targetPath}?${query.toString()}`);
	} catch (error) {
		return next(error);
	}
});

// Serve static client pages (including /sections/.../index.html links from search).
app.use(express.static(clientRoot));

function main() {
	try {
		app.listen(PORT, () => {
			console.log(`API server running on http://localhost:${PORT}`);
			console.log(`Site and admin: http://localhost:${PORT}/`);
		});
	} catch (error) {
		console.error('Server error:', error);
		process.exit(1);
	}
}

main();
