import cv2
import mediapipe as mp
import numpy as np
import joblib
import time
from collections import deque


# ==========================================
# SETTINGS
# ==========================================

MODEL_FILE = "sign_model.pkl"

FRAMES_PER_SEQUENCE = 30
FEATURES_PER_FRAME = 126

CONFIDENCE_THRESHOLD = 0.60


# ==========================================
# LOAD MODEL
# ==========================================

print("Loading SignBridge model...")

model_data = joblib.load(MODEL_FILE)

model = model_data["model"]
signs = model_data["signs"]

print("Model loaded successfully!")
print("Signs:", ", ".join(signs))


# ==========================================
# MEDIAPIPE
# ==========================================

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)


# ==========================================
# LANDMARK EXTRACTION
# ==========================================

def normalize_hand(landmarks):

    points = np.array(
        [[lm.x, lm.y, lm.z] for lm in landmarks],
        dtype=np.float32
    )

    # Wrist as origin
    points = points - points[0]

    # Scale normalization
    distances = np.linalg.norm(points, axis=1)

    max_distance = np.max(distances)

    if max_distance > 0:
        points = points / max_distance

    return points.flatten()


def extract_features(results):

    left_hand = None
    right_hand = None

    if results.multi_hand_landmarks and results.multi_handedness:

        for hand_landmarks, handedness in zip(
            results.multi_hand_landmarks,
            results.multi_handedness
        ):

            label = handedness.classification[0].label

            features = normalize_hand(
                hand_landmarks.landmark
            )

            if label == "Left":
                left_hand = features

            elif label == "Right":
                right_hand = features


    # Empty hand = 63 zeros
    empty_hand = np.zeros(63, dtype=np.float32)

    if left_hand is None:
        left_hand = empty_hand

    if right_hand is None:
        right_hand = empty_hand

    return np.concatenate(
        [left_hand, right_hand]
    )


# ==========================================
# CAMERA
# ==========================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():

    print("ERROR: Could not open webcam.")
    exit()


# ==========================================
# VARIABLES
# ==========================================

sequence = deque(
    maxlen=FRAMES_PER_SEQUENCE
)

prediction = "Waiting..."
confidence = 0.0

last_prediction = ""
stable_count = 0

start_time = time.time()


# ==========================================
# MAIN LOOP
# ==========================================

print("\n========================================")
print("       SIGNBRIDGE LIVE PREDICTION")
print("========================================")
print("\nShow a sign to the camera.")
print("Press Q to quit.\n")


while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read webcam.")
        break


    # Mirror camera
    frame = cv2.flip(frame, 1)


    # Convert BGR → RGB
    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )


    # MediaPipe detection
    results = hands.process(rgb)


    # Draw landmarks
    if results.multi_hand_landmarks:

        for hand_landmarks in results.multi_hand_landmarks:

            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS
            )


    # Extract current frame features
    features = extract_features(results)

    sequence.append(features)


    # ======================================
    # PREDICT AFTER 30 FRAMES
    # ======================================

    if len(sequence) == FRAMES_PER_SEQUENCE:

        input_data = np.array(sequence)

        input_data = input_data.reshape(1, -1)


        # Prediction probabilities
        probabilities = model.predict_proba(
            input_data
        )[0]


        best_index = np.argmax(probabilities)

        predicted_sign = model.classes_[best_index]

        confidence = probabilities[best_index]


        if confidence >= CONFIDENCE_THRESHOLD:

            prediction = predicted_sign

        else:

            prediction = "Unknown"


        # Reset sequence after prediction
        sequence.clear()


    # ======================================
    # UI
    # ======================================

    cv2.rectangle(
        frame,
        (0, 0),
        (640, 100),
        (0, 0, 0),
        -1
    )


    cv2.putText(
        frame,
        f"Sign: {prediction}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        f"Confidence: {confidence * 100:.1f}%",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        "Press Q to quit",
        (450, 470),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )


    # Show camera
    cv2.imshow(
        "SignBridge - Live Sign Recognition",
        frame
    )


    # Quit
    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):

        break


# ==========================================
# CLEANUP
# ==========================================

cap.release()

cv2.destroyAllWindows()

hands.close()

print("\nPrediction stopped.")

