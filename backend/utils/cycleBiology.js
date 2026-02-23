export function getCycleBiologyData(cycleLength = 28) {
  // Biologically, ovulation occurs roughly 14 days before the end of the cycle.
  const ovulationDay = Math.round(cycleLength - 14);

  // Define dynamic phase boundaries
  const menstruationEnd = 5; // Standard bleed duration
  const follicularStart = menstruationEnd + 1;
  const follicularEnd = ovulationDay - 2;
  const ovulatoryStart = ovulationDay - 1;
  const ovulatoryEnd = ovulationDay + 1; // 3-day peak window
  const lutealStart = ovulationDay + 2;

  return {
    menstruation: {
      days: `1-${menstruationEnd}`,
      hormoneProfile:
        'Estrogen and progesterone crash to their lowest baseline.',
      performanceImpact:
        'Lower energy levels, reduced endurance, and potential biomechanical changes due to cramping.',
      trainingFocus:
        'Baseline maintenance, mobility work, and low-intensity steady state (LISS) cardio.',
      recoveryAndOther:
        'Systemic inflammation is high. Recovery from intense muscle damage is slower. The body has a higher demand for iron and hydration to offset blood loss.',
    },
    follicular: {
      days: `${follicularStart}-${follicularEnd}`,
      hormoneProfile:
        'Estrogen rises steadily; testosterone begins a slow climb.',
      performanceImpact:
        'High energy, increased pain tolerance, and optimal access to stored carbohydrates for explosive energy.',
      trainingFocus:
        'Progressive overload, heavy resistance training, and high-intensity interval training (HIIT).',
      recoveryAndOther:
        "The 'Golden Window' for athletes. Muscle recovery is at its absolute peak. Sleep architecture is optimal, and the body builds muscle mass most efficiently during this block.",
    },
    ovulatory: {
      days: `${ovulatoryStart}-${ovulatoryEnd}`,
      hormoneProfile:
        'Estrogen peaks sharply; Luteinizing Hormone (LH) surges.',
      performanceImpact:
        'Absolute peak power output and maximum baseline strength.',
      trainingFocus:
        'Hitting 1 Rep Maxes (1RM) and peak athletic performance, but with highly controlled eccentric (lowering) movements.',
      recoveryAndOther:
        'CRITICAL INJURY RISK: Peak estrogen decreases collagen synthesis, causing ligament laxity. Female athletes are up to 6x more likely to suffer an ACL tear during this 72-hour window. Joint stability must be prioritized.',
    },
    luteal: {
      days: `${lutealStart}-${cycleLength}`,
      hormoneProfile:
        'Progesterone dominates; estrogen makes a secondary bump before both crash (Late Luteal).',
      performanceImpact:
        'Decreased aerobic capacity, increased cardiovascular strain, and harder access to stored glycogen (carbs).',
      trainingFocus:
        'Tapering volume, shifting to moderate-intensity workouts, and prioritizing form over heavy weight.',
      recoveryAndOther:
        'Progesterone breaks down amino acids, making muscle recovery significantly slower. Core body temperature is elevated by ~0.5°C, reducing heat tolerance and increasing the risk of dehydration. Caloric burn at rest increases by 5-10%, requiring more fuel.',
    },
  };
}

export function inferPhaseFromDay(currentDay, cycleLength = 28) {
  const localBiology = getCycleBiologyData(cycleLength);
  for (const [phaseName, info] of Object.entries(localBiology)) {
    const [startDay, endDay] = info.days
      .split('-')
      .map(d => parseInt(d, 10));
    if (currentDay >= startDay && currentDay <= endDay) {
      return {
        phase: phaseName,
        context: info.hormoneProfile,
      };
    }
  }
  return { phase: 'unknown', context: 'Unable to determine biological phase.' };
}
