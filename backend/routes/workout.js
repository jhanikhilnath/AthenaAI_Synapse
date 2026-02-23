import express from 'express';
import {
  generateWorkout,
  tweakWorkout,
  uploadDetailedPlan,
} from '../controllers/workoutController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// protected routes
router.post('/generate', verifyToken, generateWorkout);
router.post('/tweak', verifyToken, tweakWorkout);
router.post('/upload', verifyToken, uploadDetailedPlan);

export default router;
