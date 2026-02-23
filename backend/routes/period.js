import express from 'express';
import {
  logBleedingDay,
  getCycleInfo,
} from '../controllers/periodController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/bleeding', verifyToken, logBleedingDay); // record one or more blood flow dates
// previous /start and /end endpoints have been removed; use /bleeding exclusively
router.get('/', verifyToken, getCycleInfo);

export default router;
