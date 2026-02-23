import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.regularizers import l2
from tensorflow.keras.callbacks import ReduceLROnPlateau

print("🚀 Booting up Athena MLP Training Pipeline (Optimized Edition)...")

dataset_path = 'menstrual_cycle_dataset_with_factors.csv'

if not os.path.exists(dataset_path):
    print(
        f"❌ Error: Could not find {dataset_path}. Please ensure the Kaggle CSV is in this folder.")
    exit()

# --- 1. LOAD AND PREP DATA ---
df = pd.read_csv(dataset_path)

# Ensure columns have no trailing spaces from Kaggle
df.columns = df.columns.str.strip()

# Target calculation
df['Cycle Start Date'] = pd.to_datetime(df['Cycle Start Date'])
df['Next Cycle Start Date'] = pd.to_datetime(df['Next Cycle Start Date'])
df['Target_Next_Cycle_Length'] = (
    df['Next Cycle Start Date'] - df['Cycle Start Date']).dt.days

# --- 2. TWEAK #1: FEATURE CROSSING (The Burnout Index) ---
# We multiply Stress Level by lack of sleep to give the AI a compounded "fatigue" metric
if 'Stress Level' in df.columns and 'Sleep Hours' in df.columns:
    df['Burnout_Index'] = df['Stress Level'] * (24 - df['Sleep Hours'])

# Drop non-predictive columns
columns_to_drop = ['User ID', 'Cycle Start Date', 'Next Cycle Start Date']
df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])

# Categorical Encoding for text dropdowns
categorical_cols = ['Exercise Frequency', 'Diet', 'Symptoms']
df = pd.get_dummies(
    df, columns=[col for col in categorical_cols if col in df.columns])

# --- 3. SPLIT FEATURES AND TARGET ---
X = df.drop(columns=['Target_Next_Cycle_Length']).values
y = df['Target_Next_Cycle_Length'].values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42)

# --- 4. TWEAK #2: L2 REGULARIZATION ---
# Adding L2 penalty to the kernel weights forces the network to ignore noisy outliers
model = Sequential([
    Dense(64, activation='relu', kernel_regularizer=l2(
        0.01), input_shape=(X_train.shape[1],)),
    Dropout(0.3),
    Dense(32, activation='relu', kernel_regularizer=l2(0.01)),
    Dropout(0.2),
    Dense(16, activation='relu', kernel_regularizer=l2(0.01)),
    Dense(1, activation='linear')
])

# --- 5. TWEAK #3: LEARNING RATE SCHEDULER ---
# Start fast, but slow down by 50% if the validation loss stops improving for 5 epochs
custom_optimizer = Adam(learning_rate=0.005)
model.compile(optimizer=custom_optimizer, loss='mse', metrics=['mae'])

lr_scheduler = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=5,
    min_lr=0.0001,
    verbose=1
)

print("\n🧠 Optimized Architecture Built. Training Lifestyle Forecaster...")

# --- 6. TRAIN AND SAVE ---
history = model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=8,
    validation_data=(X_test, y_test),
    callbacks=[lr_scheduler]
)

# Evaluate the final accuracy
loss, mae = model.evaluate(X_test, y_test)
print(f"\n✅ Training Complete! Mean Absolute Error: +/- {mae:.2f} days")

model.save('athena_lifestyle_forecaster_v3.h5')
joblib.dump(scaler, 'athena_scaler.pkl')
print("💾 Model saved securely as 'athena_lifestyle_forecaster_v3.h5'")
