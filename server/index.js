import app from './app.js';
import { PORT } from './config/constants.js';

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
