import Athlete from '../models/Athlete.js';

export async function addBiometrics(req, res) {
  try {
    const userId = req.user.id;
    // fetch athlete so we can infer cycle info if not sent
    const athlete = await Athlete.findById(userId);
    if (!athlete) return res.status(404).json({ message: 'User not found' });

    const {
      age,
      bmi,
      height,
      sleep_hours,
      stress_level,
      cycle_length,
      period_length,
      current_cycle_day,
      exercise_frequency,
      diet,
      symptoms,
      mood,
      weight,
      day_of_cycle,
      date,
    } = req.body;

    // compute bmi if not provided but weight+height available
    let finalBmi = bmi;
    if (finalBmi == null) {
      if (weight != null && height != null) {
        finalBmi = weight / (height / 100) ** 2;
      } else {
        return res.status(400).json({
          message: 'BMI missing and cannot compute (weight & height required)',
        });
      }
    }

    // require all compulsory fields
    const requiredFields = [
      { key: 'age', val: age },
      { key: 'weight', val: weight },
      { key: 'height', val: height },
      { key: 'sleep_hours', val: sleep_hours },
      { key: 'stress_level', val: stress_level },
      { key: 'mood', val: mood },
      { key: 'symptoms', val: symptoms },
      { key: 'exercise_frequency', val: exercise_frequency },
      { key: 'diet', val: diet },
    ];
    for (const field of requiredFields) {
      if (field.val == null || field.val === '') {
        return res.status(400).json({
          message: `Missing required field: ${field.key}`,
        });
      }
    }

    const entry = {
      age,
      bmi: finalBmi,
      height,
      sleep_hours,
      stress_level,
      cycle_length,
      period_length,
      current_cycle_day,
      exercise_frequency,
      diet,
      symptoms,
      mood,
      weight,
      day_of_cycle,
      date: date ? new Date(date) : undefined,
    };

    // if the caller didn't provide cycling info, try to infer from stored history
    if (entry.current_cycle_day == null) {
      const derived =
        athlete.getCurrentCycleDay && athlete.getCurrentCycleDay();
      if (derived != null) entry.current_cycle_day = derived;
    }
    if (entry.cycle_length == null && athlete.cycle_length != null) {
      entry.cycle_length = athlete.cycle_length;
    }
    if (entry.period_length == null && athlete.period_length != null) {
      entry.period_length = athlete.period_length;
    }

    // remove undefined fields
    Object.keys(entry).forEach(k => entry[k] === undefined && delete entry[k]);

    // sanity check: period_length (bleeding days) must be <= cycle_length (full cycle)
    if (entry.cycle_length != null && entry.period_length != null) {
      if (entry.period_length > entry.cycle_length) {
        return res.status(400).json({
          message: `Invalid: period_length (${entry.period_length} bleeding days) cannot exceed cycle_length (${entry.cycle_length} total cycle days)`,
        });
      }
      if (entry.period_length < 2 || entry.period_length > 10) {
        console.warn(
          `Unusual period_length: ${entry.period_length}. Expected 2-10 days.`,
        );
      }
      if (entry.cycle_length < 18 || entry.cycle_length > 40) {
        console.warn(
          `Unusual cycle_length: ${entry.cycle_length}. Expected 18-40 days.`,
        );
      }
    }

    athlete.biometricsHistory = athlete.biometricsHistory || [];
    athlete.biometricsHistory.push(entry);
    const updated = await athlete.save();
    const result = await Athlete.findById(userId).select('-password');

    res.status(200).json({ athlete: result, added: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add biometrics' });
  }
}
