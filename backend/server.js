import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// avoid deprecation warnings about `new: true` by defaulting to after
mongoose.set('returnDocument', 'after');
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import workoutRouter from './routes/workout.js';
import athleteRouter from './routes/athlete.js';
import biometricsRouter from './routes/biometrics.js';
import periodRouter from './routes/period.js';

dotenv.config({ quiet: true });
const app = express();

// --- DATABASE CONNECTION ---
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/athena';
await mongoose
  .connect(mongoUri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Authentication routes
app.use('/api/auth', authRouter);

// API routers
app.use('/api/workout', workoutRouter);
app.use('/api/athlete', athleteRouter);
app.use('/api/biometrics', biometricsRouter);
app.use('/api/periods', periodRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Athena Backend running on http://localhost:${PORT}`);
});
