import express from 'express';
import { addBiometrics } from '../controllers/biometricsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Add a new biometrics entry for the authenticated athlete
router.post('/', verifyToken, addBiometrics);

export default router;
