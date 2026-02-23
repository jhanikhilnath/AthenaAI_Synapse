import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateWorkoutPlan(
  userProfile,
  phaseData,
  previousPlan = null,
  workoutRating = null,
  comments = null,
  predictedNextPeriodStart = null,
  localBiology = null,
  currentPhaseName = null,
) {
  // Use gemini-2.5-flash for the fastest JSON response times during a hackathon demo
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let prompt = `
    You are an elite Olympic sports scientist and strength coach. 
    You are designing a 7-day training split for an athlete.
    
    ATHLETE PROFILE:
    - Sport: ${userProfile.sport} (Focus on biomechanics of this sport)
    - Experience Level: ${userProfile.experienceLevel}
    
    BIOLOGICAL CONTEXT (CRITICAL):
    - Current Menstrual Phase: ${phaseData.current_phase}
    - Physiological Context: ${phaseData.physiological_context}
${
  predictedNextPeriodStart
    ? `    - Predicted Next Period Start: ${new Date(predictedNextPeriodStart).toDateString()}
`
    : ''
}
${
  currentPhaseName
    ? `    - Phase Name (redundant): ${currentPhaseName}
`
    : ''
}
${
  localBiology
    ? `    - Local Cycle Biology Details: ${JSON.stringify(localBiology)}
`
    : ''
}
    INSTRUCTIONS:
    1. Generate a 7-day workout plan in strict JSON format.
    2. Incorporate 2 active recovery or rest days.
    `;

  if (previousPlan && workoutRating) {
    prompt += `
        FEEDBACK PROTOCOL (STRICT):
        The athlete rated their last week's plan a ${workoutRating} out of 10 (1 = Too easy, 10 = Exhausted/Too hard).
        Here is the previous plan: ${JSON.stringify(previousPlan)}
        
        RULE: YOU MUST KEEP THE EXACT SAME EXERCISES FROM THE PREVIOUS PLAN. 
        DO NOT CHANGE THE EXERCISES. 
        ONLY adjust the 'sets' and 'reps' to map to their feedback rating AND their current biological phase. 
        (e.g., If rating is 9 and they are in the Late Luteal phase, drastically reduce sets/reps. If rating is 3 and they are Follicular, increase sets/reps).
        `;
  }

  if (comments) {
    prompt += `
        ATHLETE COMMENTS: ${comments}
        `;
  }

  prompt += `
    Output ONLY a valid JSON object matching this exact structure, with no markdown formatting or backticks:
    {
      "athlete_summary": "Brief explanation of how the phase and sport influenced this plan",
      "schedule": [
        {
          "day": 1,
          "focus": "e.g., Lower Body Power",
          "exercises": [
            { "name": "Barbell Squat", "sets": 4, "reps": 5, "rest_seconds": 120 }
          ]
        }
      ]
    }
    `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response
      .text()
      .replace(/```json|```/g, '')
      .trim();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate workout plan from AI.');
  }
}

export async function parseAndImproveWorkoutPlan(
  textPlan,
  userProfile,
  phaseData,
  predictedNextPeriodStart = null,
  localBiology = null,
  currentPhaseName = null,
) {
  // Use gemini-2.5-flash for the fastest JSON response times during a hackathon demo
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are an elite Olympic sports scientist and strength coach.
    You have been given a detailed text-based workout plan by an athlete.
    
    TEXT WORKOUT PLAN:
    """
    ${textPlan}
    """

    ATHLETE PROFILE:
    - Sport: ${userProfile.sport} (Focus on biomechanics of this sport)
    - Experience Level: ${userProfile.experienceLevel}
    
    BIOLOGICAL CONTEXT (CRITICAL):
    - Current Menstrual Phase: ${phaseData.current_phase}
    - Physiological Context: ${phaseData.physiological_context}
${
  predictedNextPeriodStart
    ? `    - Predicted Next Period Start: ${new Date(predictedNextPeriodStart).toDateString()}
`
    : ''
}
${
  currentPhaseName
    ? `    - Phase Name (redundant): ${currentPhaseName}
`
    : ''
}
${
  localBiology
    ? `    - Local Cycle Biology Details: ${JSON.stringify(localBiology)}
`
    : ''
}
    INSTRUCTIONS:
    1. Parse the provided detailed TEXT WORKOUT PLAN.
    2. Convert it into a strict JSON format matching the schema below.
    3. CRITICAL: Analyze the plan against the athlete's sport, experience level, and SPECIFICALLY their biological context (menstrual phase).
    4. SUGGEST IMPROVEMENTS by modifying the parsed plan to better fit their current phase and sport. (e.g., if they are in the Late Luteal phase, you might reduce the intensity or volume of the provided plan; if they are in Follicular, you might increase it).
    
    Output ONLY a valid JSON object matching this exact structure, with no markdown formatting or backticks:
    {
      "athlete_summary": "Brief explanation of how the phase, biometrics, and sport influenced the suggested improvements to the original plan",
      "schedule": [
        {
          "day": 1,
          "focus": "e.g., Lower Body Power",
          "exercises": [
            { "name": "Barbell Squat", "sets": 4, "reps": 5, "rest_seconds": 120 }
          ]
        }
      ]
    }
    `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response
      .text()
      .replace(/\`\`\`json|\`\`\`/g, '')
      .trim();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to parse and improve workout plan from AI.');
  }
}
