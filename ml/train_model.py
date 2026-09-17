import os
import glob
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


# ==============================
# SETTINGS
# ==============================

DATASET_DIR = "dataset"
MODEL_FILE = "sign_model.pkl"

FRAMES_PER_SEQUENCE = 30
FEATURES_PER_FRAME = 126


# ==============================
# LOAD DATA
# ==============================

print("\n========================================")
print("       SIGNBRIDGE MODEL TRAINING")
print("========================================\n")

files = glob.glob(os.path.join(DATASET_DIR, "*", "sequences.csv"))

if not files:
    print("ERROR: No sequences.csv files found inside dataset/")
    exit()

X = []
y = []

print("Loading dataset...\n")

for file in files:

    df = pd.read_csv(file)

    sign_name = os.path.basename(os.path.dirname(file))

    print(f"{sign_name}: {len(df)} frames")

    # Sort properly
    df = df.sort_values(["sequence_id", "frame"])

    feature_columns = [
        col for col in df.columns
        if col not in ["sequence_id", "frame", "label"]
    ]

    # Group frames into complete sequences
    for sequence_id, group in df.groupby("sequence_id"):

        group = group.sort_values("frame")

        if len(group) != FRAMES_PER_SEQUENCE:
            print(
                f"Skipping {sign_name} sequence {sequence_id}: "
                f"{len(group)} frames"
            )
            continue

        sequence_data = group[feature_columns].values

        # Make sure each frame has 126 features
        if sequence_data.shape != (
            FRAMES_PER_SEQUENCE,
            FEATURES_PER_FRAME
        ):
            print(
                f"Skipping {sign_name} sequence {sequence_id}: "
                f"shape {sequence_data.shape}"
            )
            continue

        # Flatten:
        # 30 frames × 126 features = 3780 features
        flattened = sequence_data.flatten()

        X.append(flattened)
        y.append(sign_name)


# ==============================
# CONVERT TO NUMPY
# ==============================

X = np.array(X)
y = np.array(y)

print("\n----------------------------------------")
print("DATASET SUMMARY")
print("----------------------------------------")

print("Total sequences :", len(X))
print("Features/sequence:", X.shape[1])
print("Signs            :", len(np.unique(y)))

print("\nSigns:")

for sign in sorted(np.unique(y)):
    print(f"  {sign}: {np.sum(y == sign)} sequences")


# ==============================
# CHECK DATA
# ==============================

if len(X) == 0:
    print("\nERROR: No valid sequences found.")
    exit()

if len(np.unique(y)) < 2:
    print("\nERROR: At least 2 different signs are required.")
    exit()


# ==============================
# TRAIN / TEST SPLIT
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n----------------------------------------")
print("TRAIN / TEST")
print("----------------------------------------")

print("Training sequences:", len(X_train))
print("Testing sequences :", len(X_test))


# ==============================
# TRAIN MODEL
# ==============================

print("\nTraining Random Forest model...")
print("Please wait...\n")

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

model.fit(X_train, y_train)


# ==============================
# EVALUATE
# ==============================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n========================================")
print("           MODEL RESULTS")
print("========================================")

print(f"\nAccuracy: {accuracy * 100:.2f}%\n")

print("Classification Report:\n")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ==============================
# SAVE MODEL
# ==============================

model_data = {
    "model": model,
    "frames_per_sequence": FRAMES_PER_SEQUENCE,
    "features_per_frame": FEATURES_PER_FRAME,
    "signs": sorted(np.unique(y))
}

joblib.dump(model_data, MODEL_FILE)

print("----------------------------------------")
print(f"Model saved successfully:")
print(f"  {MODEL_FILE}")
print("----------------------------------------")

print("\nTraining completed successfully! 🎉")

