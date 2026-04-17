import cors from 'cors';
import express from 'express';
import { API_PREFIX, PORT } from './config/constants.js';
import apiRoutes from './routes/router.js';

const app = express();

app.use(cors());
app.use(express.json());

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
