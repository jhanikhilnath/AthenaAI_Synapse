from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib

app = FastAPI(title="Athena AI Engine")

print("⏳ Loading Random Forest Model...")
model = joblib.load('athena_rf_forecaster.pkl')
scaler = joblib.load('athena_rf_scaler.pkl')
# Load the feature names saved during training so we match the exact order
expected_features = model.feature_names_in_
print("✅ Athena Core Online.")

# 1. DEFINE THE INCOMING JSON SCHEMA (Matches Node.js exactly)


class UserBiometrics(BaseModel):
    age: float
    bmi: float
    sleep_hours: float
    stress_level: int
    cycle_length: float
    period_length: float
    current_cycle_day: int
    exercise_frequency: str
    diet: str
    symptoms: str

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
        # Calculate our custom Burnout feature
        burnout_index = data.stress_level * (24 - data.sleep_hours)

        # Create a dictionary matching the base Kaggle columns
        input_data = {
            'Age': [data.age],
            'BMI': [data.bmi],
            'Sleep Hours': [data.sleep_hours],
            'Stress Level': [data.stress_level],
            # Note: this gets mapped to your synthetic feature
            'Cycle Length': [data.cycle_length],
            'Period Length': [data.period_length],
            'Burnout_Index': [burnout_index],
            f'Exercise Frequency_{data.exercise_frequency}': [1],
            f'Diet_{data.diet}': [1],
            f'Symptoms_{data.symptoms}': [1]
        }

        # Convert to DataFrame
        df_input = pd.DataFrame(input_data)

        # Ensure all expected columns exist (fill missing dummy columns with 0)
        for col in expected_features:
            if col not in df_input.columns:
                df_input[col] = 0

        # Enforce exact column order
        df_input = df_input[expected_features]

        # Scale and Predict
        scaled_features = scaler.transform(df_input)
        predicted_length = float(model.predict(scaled_features)[0])

        # Calculate the Phase
        phase_name, phase_context = get_current_phase(
            data.current_cycle_day, predicted_length)

        return {
            "predicted_cycle_length": round(predicted_length, 1),
            "current_phase": phase_name,
            "physiological_context": phase_context
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
