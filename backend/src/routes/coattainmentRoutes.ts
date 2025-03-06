import express from 'express';
import { calculateCoattainment } from '../controllers/coattainmentController';

const router = express.Router();

router.get('/:batchId/:semId', calculateCoattainment);

export default router;
