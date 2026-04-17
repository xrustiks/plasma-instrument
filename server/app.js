import cors from 'cors';
import express from 'express';
import { API_PREFIX } from './config/constants.js';
import apiRoutes from './routes/router.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(API_PREFIX, apiRoutes);

export default app;
