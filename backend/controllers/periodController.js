import Athlete from '../models/Athlete.js';
import { getCycleBiologyData } from '../utils/cycleBiology.js';

// list of fields expected by the FastAPI model (same as workoutController)
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

// helper to compute average length of closed cycles using actively logged bleeding dates
function getAveragePeriodLength(athlete) {
  const lengths = (athlete.cycleHistory || [])
    .filter(c => c.bleedingDates && Array.isArray(c.bleedingDates) && c.bleedingDates.length > 0)
    .map(c => c.bleedingDates.length);
  if (lengths.length === 0) return null;
  const sum = lengths.reduce((a, b) => a + b, 0);
  return Math.round(sum / lengths.length);
}

// if the latest biometrics record is missing required fields we can look back
// through the athlete's history to find the most recent value for each key.
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

function prepareForMl(bio) {
  const payload = {};
  for (const key of mlFields) {
    if (bio[key] === undefined || bio[key] === null) {
      throw new Error(`Missing biometric field: ${key}`);
    }
    payload[key] = bio[key];
  }
  return payload;
}

// helper to calculate days between two dates (round down)
function daysBetween(d1, d2) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

function sortDates(arr) {
  return arr.map(d => new Date(d)).sort((a, b) => a - b);
}

const GAP_THRESHOLD_DAYS = 3; // number of days without bleeding before we consider a new cycle

export async function logBleedingDay(req, res) {
  try {
    const userId = req.user.id;
    let { date, dates } = req.body;

    // normalize input to an array
    let incoming = [];
    if (dates && Array.isArray(dates)) incoming = dates;
    else if (date) incoming = [date];
    else incoming = [new Date()];

    incoming = sortDates(incoming);
    const first = incoming[0];
    const last = incoming[incoming.length - 1];

    const athlete = await Athlete.findById(userId);
    if (!athlete) return res.status(404).json({ message: 'User not found' });

    athlete.cycleHistory = athlete.cycleHistory || [];
    let history = athlete.cycleHistory;
    let current = history[history.length - 1];

    if (current && !current.end) {
      // there is an active cycle, decide whether this bleeding continues it
      const lastBleed =
        (current.bleedingDates && current.bleedingDates.slice(-1)[0]) ||
        current.start;
      const gap = daysBetween(lastBleed, first);
      if (gap <= GAP_THRESHOLD_DAYS) {
        // continuation: merge dates only, keep cycle open
        current.bleedingDates = Array.from(
          new Set([
            ...(current.bleedingDates || []).map(d =>
              new Date(d).toISOString(),
            ),
            ...incoming.map(d => new Date(d).toISOString()),
          ]),
        ).map(d => new Date(d));
        // do NOT set current.end or current.length until cycle closes
      } else {
        // new cycle detected: close old using the day before the new cycle starts
        current.end = new Date(first.getTime() - 24 * 60 * 60 * 1000);
        current.length = daysBetween(new Date(current.start), first);
        // start a fresh entry, open-ended
        history.push({
          start: first,
          bleedingDates: incoming.map(d => new Date(d)),
        });
      }
    } else {
      // no active cycle, just create one (open-ended until next bleeds)
      history.push({
        start: first,
        bleedingDates: incoming.map(d => new Date(d)),
      });
    }

    athlete.cycle_length =
      history.length >= 2
        ? daysBetween(
            history[history.length - 2].start,
            history[history.length - 1].start,
          )
        : athlete.cycle_length;
    // period_length should reflect the most recently closed cycle (i.e. length of bleeding phase)
    const closed = history.filter(c => c.end != null);
    if (closed.length > 0) {
      const lastClosed = closed[closed.length - 1];
      const sortedDates = sortDates(lastClosed.bleedingDates || [lastClosed.start]);
      athlete.period_length = daysBetween(new Date(lastClosed.start), sortedDates[sortedDates.length - 1]) + 1;
    }
    athlete.current_cycle_day = athlete.getCurrentCycleDay?.();

    athlete.cycleHistory = history;
    await athlete.save();

    res
      .status(200)
      .json({ athlete, updatedCycle: history[history.length - 1] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not log bleeding day' });
  }
}

export async function getCycleInfo(req, res) {
  try {
    const userId = req.user.id;
    const athlete = await Athlete.findById(userId).select('-password');
    if (!athlete) return res.status(404).json({ message: 'User not found' });

    const avgCycle = athlete.getAverageCycleLength();
    const lastStart = (athlete.cycleHistory || []).slice(-1)[0]?.start;
    const nextStart = athlete.getPredictedNextPeriodStart();

    let ovulation = null;
    let fertileWindow = null;
    if (nextStart) {
      ovulation = new Date(nextStart.getTime() - 14 * 24 * 60 * 60 * 1000);
      fertileWindow = {
        start: new Date(ovulation.getTime() - 2 * 24 * 60 * 60 * 1000),
        end: new Date(ovulation.getTime() + 2 * 24 * 60 * 60 * 1000),
      };
    }

    const currentCycleDay = athlete.getCurrentCycleDay();

    // attempt to calculate current phase via ML if cycle info exists
    let currentPhase = null;
    let physiologicalContext = null;
    let localBiology = null;
    if (currentCycleDay != null) {
      // build biometric payload using last entry and derived cycle data
      const latestBiometrics =
        (athlete.biometricsHistory || []).slice(-1)[0] || {};
      const bioForMl = { ...latestBiometrics };
      // ensure age/other required fields aren't omitted if the last entry was partial
      fillFromHistory(bioForMl, athlete.biometricsHistory);
      // override period_length strictly with derived average, ignoring any bugged historical static values
      const avgPeriod = getAveragePeriodLength(athlete);
      if (avgPeriod != null) {
        bioForMl.period_length = avgPeriod;
      } else if (athlete.period_length != null) {
        bioForMl.period_length = athlete.period_length;
      }
      
      const useCycleLength = athlete.cycle_length || avgCycle;
      if (
        (bioForMl.cycle_length == null || bioForMl.cycle_length === '') &&
        useCycleLength != null
      ) {
        bioForMl.cycle_length = useCycleLength;
      }
      
      bioForMl.current_cycle_day = currentCycleDay;

      // only call ML if we have the minimum required cycle information
      if (bioForMl.cycle_length != null && bioForMl.period_length != null) {
        // make sure values match the integer schema expected by FastAPI
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
        try {
          const mlInput = prepareForMl(bioForMl);
          console.log('ML payload for period lookup:', JSON.stringify(mlInput));
          const startTime = Date.now();
          const mlResponse = await fetch(process.env.FASTAPI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mlInput),
          });
          const endTime = Date.now();
          console.log(
            'Period ML call took',
            endTime - startTime,
            'ms status',
            mlResponse.status,
          );
          if (mlResponse.ok) {
            const phaseData = await mlResponse.json();
            console.log('ML service response (getCycleInfo):', phaseData);
            currentPhase = phaseData.current_phase;
            physiologicalContext = phaseData.physiological_context;
          }
        } catch (e) {
          console.warn('Unable to compute phase data:', e.message);
        }
      } else {
        console.warn(
          'Skipping ML phase calc due to incomplete cycle data',
          bioForMl,
        );
      }

      if (useCycleLength != null) {
        localBiology = getCycleBiologyData(useCycleLength);
      }

      // fallback: if ML didn't give us a currentPhase but we know local biology,
      // infer the phase purely from cycle day boundaries. this lets the endpoint
      // still return something reasonable even when no biometrics exist.
      if (!currentPhase && localBiology) {
        for (const [phaseName, info] of Object.entries(localBiology)) {
          const [startDay, endDay] = info.days
            .split('-')
            .map(d => parseInt(d, 10));
          if (currentCycleDay >= startDay && currentCycleDay <= endDay) {
            currentPhase = phaseName;
            // use the hormone profile as a rough context if none from ML
            physiologicalContext = info.hormoneProfile;
            break;
          }
        }
      }
    }

    res.status(200).json({
      cycleHistory: athlete.cycleHistory || [],
      averageCycleLength: avgCycle,
      avgPeriodLength: getAveragePeriodLength(athlete),
      lastPeriodStart: lastStart,
      predictedNextPeriodStart: nextStart,
      ovulationDate: ovulation,
      fertileWindow,
      currentCycleDay,
      currentPhase,
      physiologicalContext,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not retrieve cycle information' });
  }
}
