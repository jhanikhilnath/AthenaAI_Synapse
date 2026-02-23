import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const biometricsSchema = new Schema(
  {
    age: Number,
    bmi: Number,
    sleep_hours: Number,
    stress_level: Number,
    cycle_length: Number, // full menstrual cycle in days (typically 21–35)
    period_length: Number, // actual bleeding/menstruation days (typically 3–7, must be ≤ cycle_length)
    current_cycle_day: Number,
    exercise_frequency: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
    },
    diet: {
      type: String,
      enum: ['Balanced', 'Vegetarian', 'High Sugar', 'Low Carb'],
    },
    symptoms: {
      type: String,
      enum: ['None', 'Cramps', 'Mood Swings'],
    },
    mood: {
      type: String,
      enum: ['Happy', 'Neutral', 'Irritable', 'Sad', 'Anxious'],
    },
    weight: Number, // in kg
    height: Number, // in cm
    day_of_cycle: Number, // redundant to current_cycle_day but explicit
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

const workoutSchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    plan: {
      athlete_summary: String,
      schedule: Array,
    },
    rating: Number,
    comments: String,
    phaseData: {
      predicted_cycle_length: Number,
      current_phase: String,
      physiological_context: String,
    },
  },
  { _id: false },
);

const athleteSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  sport: String,
  experienceLevel: String,
  biometricsHistory: [biometricsSchema],
  workouts: [workoutSchema],
  // history of past cycles for period tracking
  cycleHistory: [
    {
      start: { type: Date, required: true },
      end: Date, // when the bleeding stopped
      length: Number, // in days, calculated when end is set
      bleedingDates: [Date], // individual days when blood flow was recorded
    },
  ],
});

// Hash password before saving
athleteSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
athleteSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// compute average cycle length based on history intervals (start‑to‑start)
// if we have fewer than 2 periods in history fall back to stored cycle_length or return null
athleteSchema.methods.getAverageCycleLength = function () {
  const hist = this.cycleHistory || [];
  if (hist.length < 2) {
    return this.cycle_length || null;
  }
  const intervals = [];
  for (let i = 1; i < hist.length; i++) {
    const prev = hist[i - 1].start;
    const curr = hist[i].start;
    if (prev && curr) {
      const diff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      intervals.push(diff);
    }
  }
  if (intervals.length === 0) return this.cycle_length || null;
  const sum = intervals.reduce((a, b) => a + b, 0);
  return sum / intervals.length;
};

// compute predicted next period start date. historically this used a simple average interval,
// but we now prefer any cycle‑length prediction produced by our ML model (stored in the
// most recent workout's phaseData). fall back to the average interval if no prediction is
// available.
athleteSchema.methods.getPredictedNextPeriodStart = function () {
  // check for a cached prediction from the last workout
  let predictedLength = null;
  const lastWorkout = (this.workouts || []).slice(-1)[0];
  if (
    lastWorkout &&
    lastWorkout.phaseData &&
    typeof lastWorkout.phaseData.predicted_cycle_length === 'number'
  ) {
    predictedLength = lastWorkout.phaseData.predicted_cycle_length;
  }

  // fall back to the average/explicit cycle length if model output is absent
  if (predictedLength == null) {
    predictedLength = this.getAverageCycleLength();
  }

  // sanity check: cycle lengths over, say, 90 days are unlikely – clamp or ignore
  if (
    predictedLength != null &&
    (predictedLength < 7 || predictedLength > 35)
  ) {
    console.warn(
      `Predicted cycle length ${predictedLength} out of bounds, using average instead`,
    );
    predictedLength = this.getAverageCycleLength();
  }

  if (!predictedLength) return null;
  const last = (this.cycleHistory || []).slice(-1)[0];
  if (!last || !last.start) return null;
  return new Date(last.start.getTime() + predictedLength * 24 * 60 * 60 * 1000);
};

// compute current cycle day based on last period start
athleteSchema.methods.getCurrentCycleDay = function () {
  const last = (this.cycleHistory || []).slice(-1)[0];
  if (!last || !last.start) return null;
  const diff = Math.floor(
    (Date.now() - last.start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff + 1;
};

const Athlete = mongoose.model('Athlete', athleteSchema);
export default Athlete;
