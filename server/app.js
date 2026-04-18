import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { API_PREFIX, PORT } from './config/constants.js';
import apiRoutes from './routes/router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'storage', 'uploads')));

app.use(API_PREFIX, apiRoutes);

function main() {
	try {
		app.listen(PORT, () => {
			console.log(`API server running on http://localhost:${PORT}`);
			console.log('Admin panel: http://localhost:8000/admin/');
		});
	} catch (error) {
		console.error('Server error:', error);
		process.exit(1);
	}
}

main();
