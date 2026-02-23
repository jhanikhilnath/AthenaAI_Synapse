import Athlete from '../models/Athlete.js';

export async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const athlete = await Athlete.findById(userId).select('-password');
    if (!athlete) return res.status(404).json({ message: 'User not found' });
    const predictedNext =
      athlete.getPredictedNextPeriodStart &&
      athlete.getPredictedNextPeriodStart();
    const currentDay =
      athlete.getCurrentCycleDay && athlete.getCurrentCycleDay();
    res
      .status(200)
      .json({
        athlete,
        predictedNextPeriodStart: predictedNext,
        currentCycleDay: currentDay,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not retrieve athlete' });
  }
}
