import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { API_PREFIX, CORS_ALLOWED_ORIGINS, PORT } from './config/constants.js';
import apiRoutes from './routes/router.js';
import { readArticles } from './storage/articles-store.js';
import {
	requireAdminAuth,
	requireAdminCsrf,
	requireAdminPageAuth,
	setAdminSessionCookie,
	clearAdminSessionCookie,
	ensureAdminCsrfCookie,
	verifyAdminLoginCsrf,
	isAdminAuthConfigured,
	isValidAdminCredentials
} from './middleware/admin-basic-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const clientRoot = path.resolve(__dirname, '..', 'client');

const corsAllowedOriginsSet = new Set(CORS_ALLOWED_ORIGINS);

function isLoopbackOrigin(origin) {
	try {
		const { hostname } = new URL(origin);
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
	} catch {
		return false;
	}
}

app.use(cors({
	origin: (origin, callback) => {
		// Allow same-origin/non-browser requests that do not send Origin.
		if (!origin) {
			callback(null, true);
			return;
		}

		if (corsAllowedOriginsSet.has(origin) || isLoopbackOrigin(origin)) {
			callback(null, true);
			return;
		}

		callback(null, false);
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const adminRoot = path.join(clientRoot, 'admin');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'storage', 'uploads')));

app.get('/admin/login', (req, res) => {
	ensureAdminCsrfCookie(req, res);
	return res.redirect('/admin/login.html');
});

app.get('/admin/login.html', (req, res) => {
	ensureAdminCsrfCookie(req, res);
	return res.sendFile(path.join(adminRoot, 'login.html'));
});

app.post('/admin/login', (req, res) => {
	if (!isAdminAuthConfigured()) {
		return res.status(503).send('Admin authentication is not configured on the server');
	}

	if (!verifyAdminLoginCsrf(req)) {
		return res.status(403).send('CSRF token is missing or invalid');
	}

	const { username = '', password = '', next = '/admin/' } = req.body;
	if (!isValidAdminCredentials(username, password)) {
		return res.redirect('/admin/login.html?error=1');
	}

	setAdminSessionCookie(res);
	const safeNext = typeof next === 'string' && next.startsWith('/admin/') ? next : '/admin/';
	return res.redirect(safeNext);
});

app.post('/admin/logout', requireAdminCsrf, (req, res) => {
	clearAdminSessionCookie(req, res);
	return res.redirect('/admin/login.html');
});

// Protect the admin UI behind form-based login and session cookie.
app.use('/admin', requireAdminPageAuth, express.static(adminRoot));

app.use(API_PREFIX, requireAdminCsrf, apiRoutes);

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
