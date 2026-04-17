import { Router } from 'express';
import { SECTIONS } from '../config/constants.js';

const router = Router();

// Endpoint to get all sections
router.get('/', (req, res) => {
  res.json(SECTIONS);
});

export default router;
