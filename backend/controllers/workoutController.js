import Athlete from '../models/Athlete.js';
import {
  generateWorkoutPlan,
  parseAndImproveWorkoutPlan,
} from '../geminiService.js';
import {
  getCycleBiologyData,
  inferPhaseFromDay,
} from '../utils/cycleBiology.js';

// list of fields expected by the FastAPI model
const mlFields = [
  'age',
  'bmi',
  'sleep_hours',
  'stress_level',
  'cycle_length',
  'period_length',
  'current_cycle_day',
  'exercise_frequency',
  'diet',
  'symptoms',
  'weight',
  'height',
];

// compute average period length across closed cycles using actively logged bleeding dates
function getAveragePeriodLength(athlete) {
  const lengths = (athlete.cycleHistory || [])
    .filter(
      c =>
        c.bleedingDates &&
        Array.isArray(c.bleedingDates) &&
        c.bleedingDates.length > 0,
    )
    .map(c => c.bleedingDates.length);
  if (lengths.length === 0) return null;
  const sum = lengths.reduce((a, b) => a + b, 0);
  return Math.round(sum / lengths.length);
}

// backfill any missing required biometrics from older history entries
function fillFromHistory(bio, history = []) {
  for (const key of mlFields) {
    if (bio[key] == null) {
      for (let i = history.length - 1; i >= 0; i--) {
        const val = history[i][key];
        if (val != null) {
          bio[key] = val;
          break;
        }
      }
    }
  }
}

/**
 * Remove any extraneous keys and ensure required properties exist.
 * Returns an object suitable for POSTing to the ML service.
 * Throws an error if a required field is missing.
 */
function prepareForMl(bio) {
  const payload = {};
  console.log(bio);
  for (const key of mlFields) {
    if (bio[key] === undefined || bio[key] === null) {
      throw new Error(`Missing biometric field: ${key}`);
    }
    payload[key] = bio[key];
  }
  console.log(payload);
  return payload;
}

export async function generateWorkout(req, res) {
  try {
    console.log('hello');
    const userId = req.user.id;
    const athlete = await Athlete.findById(userId);
    if (!athlete) return res.status(404).json({ message: 'User not found' });

    // require at least one biometric entry
    if (!athlete.biometricsHistory || athlete.biometricsHistory.length === 0) {
      return res.status(400).json({
        message:
          'No biometrics on file. Please submit your latest biometrics first.',
      });
    }

    const latestBiometrics =
      athlete.biometricsHistory[athlete.biometricsHistory.length - 1];

    // start with latest biometrics and backfill any missing required fields
    const bioForMl = latestBiometrics.toObject ? latestBiometrics.toObject() : { ...latestBiometrics };
    fillFromHistory(bioForMl, athlete.biometricsHistory);
    // override period_length strictly with derived average, ignoring any bugged historical static values
    const avgPeriod = getAveragePeriodLength(athlete);
    if (avgPeriod != null) {
      bioForMl.period_length = avgPeriod;
    } else if (athlete.period_length != null) {
      bioForMl.period_length = athlete.period_length;
    }

    const derivedCycleLength =
      athlete.cycle_length || athlete.getAverageCycleLength?.();
    if (
      (bioForMl.cycle_length == null || bioForMl.cycle_length === '') &&
      derivedCycleLength != null
    ) {
      bioForMl.cycle_length = derivedCycleLength;
    }

    const derivedCurrentDay = athlete.getCurrentCycleDay?.();
    if (
      (bioForMl.current_cycle_day == null ||
        bioForMl.current_cycle_day === '') &&
      derivedCurrentDay != null
    ) {
      bioForMl.current_cycle_day = derivedCurrentDay;
    }

    // if we still lack key cycle info after derivation, ask user to log a period
    if (
      bioForMl.cycle_length == null ||
      bioForMl.period_length == null ||
      bioForMl.current_cycle_day == null
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Cycle information incomplete. Please log your period start/end so we can make accurate predictions.',
      });
    }

    // ensure integer values for ML
    [
      'cycle_length',
      'period_length',
      'current_cycle_day',
      'age',
      'sleep_hours',
      'stress_level',
    ].forEach(k => {
      if (bioForMl[k] != null && typeof bioForMl[k] === 'number') {
        bioForMl[k] = Math.round(bioForMl[k]);
      }
    });

    if (bioForMl.cycle_length < 10 || bioForMl.cycle_length > 40) {
      bioForMl.cycle_length = getAveragePeriodLength(athlete) || 28;
    }
    if (bioForMl.period_length < 1 || bioForMl.period_length > 15) {
      bioForMl.period_length = getAveragePeriodLength(athlete) || 5;
    }
    // call ML service (sanitize biometrics first)
    let mlInput;
    try {
      mlInput = prepareForMl(bioForMl);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
    // debug: show payload going to ML service
    console.log('ML payload for workout:', JSON.stringify(mlInput));
    const fetchStart = Date.now();
    let phaseData;
    try {
      const mlResponse = await fetch(process.env.FASTAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlInput),
      });
      const fetchEnd = Date.now();
      console.log(
        'ML service responded in',
        fetchEnd - fetchStart,
        'ms, status',
        mlResponse.status,
      );

      if (!mlResponse.ok) {
        const text = await mlResponse.text();
        console.error('ML service rejected payload:', text);
        throw new Error(`FastAPI ML Service Error: ${mlResponse.statusText}`);
      }
      phaseData = await mlResponse.json();
      console.log('ML service response (generateWorkout):', phaseData);
    } catch (e) {
      console.warn(
        'ML Model is not callable or failed. Falling back to local biology...',
        e.message,
      );
      const fallback = inferPhaseFromDay(
        bioForMl.current_cycle_day,
        bioForMl.cycle_length,
      );
      phaseData = {
        current_phase: fallback.phase,
        physiological_context: fallback.context,
      };
    }

    // build local biology data using derived cycle length
    const cycleLengthValue = bioForMl.cycle_length;
    const localBio = getCycleBiologyData(cycleLengthValue);
    const currentPhaseName = phaseData.current_phase || null;

    const userProfile = {
      sport: athlete.sport,
      experienceLevel: athlete.experienceLevel,
    };

    // prediction based on stored cycle history
    const nextPeriod =
      athlete.getPredictedNextPeriodStart &&
      athlete.getPredictedNextPeriodStart(phaseData?.predicted_cycle_length);

    // if we have a previous workout, hand its plan to the generator so it can
    // maintain continuity (avoiding jarring exercise swaps between successive
    // weeks when the athlete tweaks or regenerates).
    let previousWorkout = null;
    if (athlete.workouts && athlete.workouts.length > 0) {
      previousWorkout = athlete.workouts[athlete.workouts.length - 1].plan;
    }
    console.log(
      userProfile,
      phaseData,
      previousWorkout,
      null,
      null,
      nextPeriod,
      localBio,
      currentPhaseName,
    );

    const newWorkoutPlan = await generateWorkoutPlan(
      userProfile,
      phaseData,
      previousWorkout,
      null,
      null,
      nextPeriod,
      localBio,
      currentPhaseName,
    );

    // persist workout without rating/comments
    await Athlete.findByIdAndUpdate(
      userId,
      {
        $push: {
          workouts: {
            plan: newWorkoutPlan,
            phaseData,
            localBio,
            currentPhaseName,
          },
        },
      },
      { returnDocument: 'after' },
    );

    res.status(200).json({
      success: true,
      biology: phaseData,
      localBiology: localBio,
      currentPhaseName,
      plan: newWorkoutPlan,
      predictedNextPeriodStart: nextPeriod,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function tweakWorkout(req, res) {
  try {
    const userId = req.user.id;
    const { workoutRating, comments } = req.body;

    const athlete = await Athlete.findById(userId);
    if (!athlete) return res.status(404).json({ message: 'User not found' });

    // ensure biometrics exist
    if (!athlete.biometricsHistory || athlete.biometricsHistory.length === 0) {
      return res.status(400).json({
        message:
          'No biometrics on file. Please submit your latest biometrics first.',
      });
    }
    const latestBiometrics =
      athlete.biometricsHistory[athlete.biometricsHistory.length - 1];

    // attempt to derive cycle data when tweaking as well
    const bioForMl2 = latestBiometrics.toObject ? latestBiometrics.toObject() : { ...latestBiometrics };
    fillFromHistory(bioForMl2, athlete.biometricsHistory);
    
    const derivedCycleLength2 =
      athlete.cycle_length || athlete.getAverageCycleLength?.();
    if (
      (bioForMl2.cycle_length == null || bioForMl2.cycle_length === '') &&
      derivedCycleLength2 != null
    ) {
      bioForMl2.cycle_length = derivedCycleLength2;
    }
    // override period_length strictly with derived average, ignoring any bugged historical static values
    const avgPeriod2 = getAveragePeriodLength(athlete);
    if (avgPeriod2 != null) {
      bioForMl2.period_length = avgPeriod2;
    } else if (athlete.period_length != null) {
      bioForMl2.period_length = athlete.period_length;
    }

    const derivedCurrentDay2 = athlete.getCurrentCycleDay?.();
    if (
      (bioForMl2.current_cycle_day == null ||
        bioForMl2.current_cycle_day === '') &&
      derivedCurrentDay2 != null
    ) {
      bioForMl2.current_cycle_day = derivedCurrentDay2;
    }

    // ensure previous workout exists
    if (!athlete.workouts || athlete.workouts.length === 0) {
      return res.status(400).json({
        message: 'No previous workout found to tweak. Generate one first.',
      });
    }
    const previousWorkout = athlete.workouts[athlete.workouts.length - 1].plan;

    // ensure we've got cycle info; if derivation failed, instruct user
    if (
      bioForMl2.cycle_length == null ||
      bioForMl2.period_length == null ||
      bioForMl2.current_cycle_day == null
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Cycle information incomplete. Please log your period start/end so we can make accurate predictions.',
      });
    }

    // ensure integer values for ML again
    [
      'cycle_length',
      'period_length',
      'current_cycle_day',
      'age',
      'sleep_hours',
      'stress_level',
    ].forEach(k => {
      if (bioForMl2[k] != null && typeof bioForMl2[k] === 'number') {
        bioForMl2[k] = Math.round(bioForMl2[k]);
      }
    });

    if (bioForMl2.cycle_length < 10 || bioForMl2.cycle_length > 40) {
      bioForMl2.cycle_length = getAveragePeriodLength(athlete) || 28;
    }
    if (bioForMl2.period_length < 1 || bioForMl2.period_length > 15) {
      bioForMl2.period_length = getAveragePeriodLength(athlete) || 5;
    }
    // get phase data (ensure proper fields)
    let mlInput2;
    try {
      mlInput2 = prepareForMl(bioForMl2);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
    console.log('ML payload for tweak:', JSON.stringify(mlInput2));
    let phaseData;
    try {
      const mlResponse = await fetch(process.env.FASTAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlInput2),
      });
      if (!mlResponse.ok) {
        const text2 = await mlResponse.text();
        console.error('ML service rejected payload:', text2);
        throw new Error(`FastAPI ML Service Error: ${mlResponse.statusText}`);
      }
      phaseData = await mlResponse.json();
      console.log('ML service response (tweakWorkout):', phaseData);
    } catch (e) {
      console.warn(
        'ML Model is not callable or failed. Falling back to local biology...',
        e.message,
      );
      const fallback = inferPhaseFromDay(
        bioForMl2.current_cycle_day,
        bioForMl2.cycle_length,
      );
      phaseData = {
        current_phase: fallback.phase,
        physiological_context: fallback.context,
      };
    }

    // derive local biology and phase name for tweak
    const cycleLength2 = bioForMl2.cycle_length;
    const localBio2 = getCycleBiologyData(cycleLength2);
    const currentPhaseName2 = phaseData.current_phase || null;

    const userProfile = {
      sport: athlete.sport,
      experienceLevel: athlete.experienceLevel,
    };

    // prediction based on cycle history
    const nextPeriod =
      athlete.getPredictedNextPeriodStart &&
      athlete.getPredictedNextPeriodStart(phaseData?.predicted_cycle_length);

    const newPlan = await generateWorkoutPlan(
      userProfile,
      phaseData,
      previousWorkout,
      workoutRating,
      comments,
      nextPeriod,
      localBio2,
      currentPhaseName2,
    );
    // save updated workout entry
    await Athlete.findByIdAndUpdate(
      userId,
      {
        $push: {
          workouts: {
            plan: newPlan,
            rating: workoutRating,
            comments,
            phaseData,
            localBio: localBio2,
            currentPhaseName: currentPhaseName2,
          },
        },
      },
      { returnDocument: 'after' },
    );

    res.status(200).json({
      success: true,
      biology: phaseData,
      localBiology: localBio2,
      currentPhaseName: currentPhaseName2,
      plan: newPlan,
      predictedNextPeriodStart: nextPeriod,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function uploadDetailedPlan(req, res) {
  try {
    const userId = req.user.id;
    const { textPlan } = req.body;

    if (!textPlan || typeof textPlan !== 'string') {
      return res.status(400).json({ message: 'textPlan is required' });
    }

    const athlete = await Athlete.findById(userId);
    if (!athlete) return res.status(404).json({ message: 'User not found' });

    // ensure biometrics exist
    if (!athlete.biometricsHistory || athlete.biometricsHistory.length === 0) {
      return res.status(400).json({
        message:
          'No biometrics on file. Please submit your latest biometrics first.',
      });
    }
    const latestBiometrics =
      athlete.biometricsHistory[athlete.biometricsHistory.length - 1];

    // attempt to derive cycle data
    const bioForMl3 = latestBiometrics.toObject ? latestBiometrics.toObject() : { ...latestBiometrics };
    fillFromHistory(bioForMl3, athlete.biometricsHistory);
    
    const derivedCycleLength3 =
      athlete.cycle_length || athlete.getAverageCycleLength?.();
    if (
      (bioForMl3.cycle_length == null || bioForMl3.cycle_length === '') &&
      derivedCycleLength3 != null
    ) {
      bioForMl3.cycle_length = derivedCycleLength3;
    }
    // override period_length strictly with derived average
    const avgPeriod3 = getAveragePeriodLength(athlete);
    if (avgPeriod3 != null) {
      bioForMl3.period_length = avgPeriod3;
    } else if (athlete.period_length != null) {
      bioForMl3.period_length = athlete.period_length;
    }

    const derivedCurrentDay3 = athlete.getCurrentCycleDay?.();
    if (
      (bioForMl3.current_cycle_day == null ||
        bioForMl3.current_cycle_day === '') &&
      derivedCurrentDay3 != null
    ) {
      bioForMl3.current_cycle_day = derivedCurrentDay3;
    }

    // ensure we've got cycle info
    if (
      bioForMl3.cycle_length == null ||
      bioForMl3.period_length == null ||
      bioForMl3.current_cycle_day == null
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Cycle information incomplete. Please log your period start/end so we can make accurate predictions.',
      });
    }

    // ensure integer values for ML
    [
      'cycle_length',
      'period_length',
      'current_cycle_day',
      'age',
      'sleep_hours',
      'stress_level',
    ].forEach(k => {
      if (bioForMl3[k] != null && typeof bioForMl3[k] === 'number') {
        bioForMl3[k] = Math.round(bioForMl3[k]);
      }
    });

    if (bioForMl3.cycle_length < 10 || bioForMl3.cycle_length > 40) {
      bioForMl3.cycle_length = getAveragePeriodLength(athlete) || 28;
    }
    if (bioForMl3.period_length < 1 || bioForMl3.period_length > 15) {
      bioForMl3.period_length = getAveragePeriodLength(athlete) || 5;
    }

    // get phase data
    let mlInput3;
    try {
      mlInput3 = prepareForMl(bioForMl3);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
    console.log('ML payload for upload:', JSON.stringify(mlInput3));
    let phaseData;
    try {
      const mlResponse = await fetch(process.env.FASTAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlInput3),
      });
      if (!mlResponse.ok) {
        const text3 = await mlResponse.text();
        console.error('ML service rejected payload:', text3);
        throw new Error(`FastAPI ML Service Error: ${mlResponse.statusText}`);
      }
      phaseData = await mlResponse.json();
      console.log('ML service response (uploadDetailedPlan):', phaseData);
    } catch (e) {
      console.warn(
        'ML Model is not callable or failed. Falling back to local biology...',
        e.message,
      );
      const fallback = inferPhaseFromDay(
        bioForMl3.current_cycle_day,
        bioForMl3.cycle_length,
      );
      phaseData = {
        current_phase: fallback.phase,
        physiological_context: fallback.context,
      };
    }

    // derive local biology
    const cycleLength3 = bioForMl3.cycle_length;
    const localBio3 = getCycleBiologyData(cycleLength3);
    const currentPhaseName3 = phaseData.current_phase || null;

    const userProfile = {
      sport: athlete.sport,
      experienceLevel: athlete.experienceLevel,
    };

    // prediction based on cycle history
    const nextPeriod =
      athlete.getPredictedNextPeriodStart &&
      athlete.getPredictedNextPeriodStart(phaseData?.predicted_cycle_length);

    const newPlan = await parseAndImproveWorkoutPlan(
      textPlan,
      userProfile,
      phaseData,
      nextPeriod,
      localBio3,
      currentPhaseName3,
    );

    // save updated workout entry
    await Athlete.findByIdAndUpdate(
      userId,
      {
        $push: {
          workouts: {
            plan: newPlan,
            phaseData,
            localBio: localBio3,
            currentPhaseName: currentPhaseName3,
          },
        },
      },
      { returnDocument: 'after' },
    );

    res.status(200).json({
      success: true,
      biology: phaseData,
      localBiology: localBio3,
      currentPhaseName: currentPhaseName3,
      plan: newPlan,
      predictedNextPeriodStart: nextPeriod,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
