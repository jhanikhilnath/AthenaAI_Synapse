from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import joblib
from tensorflow.keras.models import load_model

app = FastAPI(title="Athena AI Engine")

print("⏳ Loading Model and Scaler...")
model = load_model('athena_lifestyle_forecaster_v3.h5', compile=False)
scaler = joblib.load('athena_scaler.pkl')
print("✅ Athena Core Online.")

# 1. DEFINE THE INCOMING JSON SCHEMA


class UserBiometrics(BaseModel):
    age: float
    bmi: float
    sleep_hours: float
    stress_level: int
    cycle_length: int
    period_length: int
    current_cycle_day: int  # Where they are TODAY
    exercise_frequency: str  # "Low", "Moderate", "High"
    diet: str               # "Balanced", "Vegetarian", "High Sugar", "Low Carb"
    symptoms: str           # "None", "Cramps", "Mood Swings"
    weight: float           # optional additional features added after training
    height: float

# 2. THE RULE ENGINE (Phase Calculator)


def get_current_phase(current_day: int, predicted_length: float):
    ovulation_day = round(predicted_length - 14)

    if 1 <= current_day <= 5:
        return "Menstruation", "Low estrogen. Focus on baseline maintenance and mobility."
    elif 6 <= current_day <= (ovulation_day - 2):
        return "Follicular", "Estrogen rising. Optimal for high-intensity, hit your 1RM!"
    elif (ovulation_day - 1) <= current_day <= (ovulation_day + 1):
        return "Ovulatory", "Estrogen peak. Max strength, but highest ligament laxity (ACL risk). Control your descent."
    elif (ovulation_day + 2) <= current_day <= (predicted_length - 5):
        return "Early Luteal", "Progesterone rising. Core temp elevated. Transition to steady-state volume."
    else:
        return "Late Luteal", "Hormone crash. High fatigue. Prioritize active recovery."

# 3. THE PREDICTION ENDPOINT


@app.post("/predict-phase")
def predict_phase(data: UserBiometrics):
    try:
        # Step A: Manual One-Hot Encoding
        # This exact order MUST match how the dataframe columns were arranged in training!
        exercise_low = 1 if data.exercise_frequency == "Low" else 0
        exercise_mod = 1 if data.exercise_frequency == "Moderate" else 0
        exercise_high = 1 if data.exercise_frequency == "High" else 0

        diet_bal = 1 if data.diet == "Balanced" else 0
        diet_veg = 1 if data.diet == "Vegetarian" else 0
        diet_sugar = 1 if data.diet == "High Sugar" else 0
        diet_carb = 1 if data.diet == "Low Carb" else 0

        symp_none = 1 if data.symptoms == "None" else 0
        symp_cramps = 1 if data.symptoms == "Cramps" else 0
        symp_mood = 1 if data.symptoms == "Mood Swings" else 0

        burnout_index = data.stress_level * (24 - data.sleep_hours)

        # Step B: Assemble the Feature Array
        raw_features = np.array([[
            data.age, data.bmi, data.sleep_hours, data.stress_level,
            data.cycle_length, data.period_length, burnout_index,
            exercise_high, exercise_low, exercise_mod,
            diet_bal, diet_sugar, diet_carb, diet_veg,
            symp_cramps, symp_mood, symp_none,
            data.weight, data.height
        ]])

        # Step C: Scale and Predict
        scaled_features = scaler.transform(raw_features)
        predicted_length = float(model.predict(scaled_features)[0][0])

        # Step D: Calculate the Phase
        phase_name, phase_context = get_current_phase(
            data.current_cycle_day, predicted_length)

        return {
            "predicted_cycle_length": round(predicted_length, 1),
            "current_phase": phase_name,
            "physiological_context": phase_context
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
