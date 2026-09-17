import cv2
import mediapipe as mp
import numpy as np
import joblib
import base64

from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque


# ==========================================
# SETTINGS
# ==========================================

MODEL_FILE = "sign_model.pkl"

FRAMES_PER_SEQUENCE = 30
CONFIDENCE_THRESHOLD = 0.60


# ==========================================
# FLASK APP
# ==========================================

app = Flask(__name__)
CORS(app)


# ==========================================
# LOAD MODEL
# ==========================================

print("Loading SignBridge model...")

model_data = joblib.load(MODEL_FILE)

model = model_data["model"]
signs = model_data["signs"]

print("Model loaded successfully!")
print("Available signs:", ", ".join(signs))


# ==========================================
# MEDIAPIPE
# ==========================================

mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)


# ==========================================
# STORE FRAME SEQUENCES
# ==========================================

sequences = {}


# ==========================================
# NORMALIZE HAND
# ==========================================

def normalize_hand(landmarks):

    points = np.array(
        [[lm.x, lm.y, lm.z] for lm in landmarks],
        dtype=np.float32
    )

    # Wrist becomes origin
    points = points - points[0]

    # Scale normalization
    distances = np.linalg.norm(points, axis=1)

    max_distance = np.max(distances)

    if max_distance > 0:
        points = points / max_distance

    return points.flatten()


# ==========================================
# EXTRACT FEATURES
# ==========================================

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


    empty_hand = np.zeros(63, dtype=np.float32)

    if left_hand is None:
        left_hand = empty_hand

    if right_hand is None:
        right_hand = empty_hand

    return np.concatenate(
        [left_hand, right_hand]
    )


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "model": "loaded",
        "signs": list(signs)
    })


# ==========================================
# PREDICT
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400


        client_id = data.get(
            "client_id",
            "default"
        )

        image_data = data.get("image")


        if not image_data:

            return jsonify({
                "success": False,
                "error": "No image received"
            }), 400


        # ==================================
        # REMOVE BASE64 PREFIX
        # ==================================

        if "," in image_data:

            image_data = image_data.split(",", 1)[1]


        # ==================================
        # DECODE IMAGE
        # ==================================

        image_bytes = base64.b64decode(
            image_data
        )

        np_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        frame = cv2.imdecode(
            np_array,
            cv2.IMREAD_COLOR
        )


        if frame is None:

            return jsonify({
                "success": False,
                "error": "Could not decode image"
            }), 400


        # ==================================
        # MEDIAPIPE
        # ==================================

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        results = hands.process(rgb)


        # ==================================
        # CREATE CLIENT SEQUENCE
        # ==================================

        if client_id not in sequences:

            sequences[client_id] = deque(
                maxlen=FRAMES_PER_SEQUENCE
            )


        # ==================================
        # EXTRACT LANDMARK FEATURES
        # ==================================

        features = extract_features(
            results
        )

        sequences[client_id].append(
            features
        )


        current_length = len(
            sequences[client_id]
        )


        # ==================================
        # NOT ENOUGH FRAMES YET
        # ==================================

        if current_length < FRAMES_PER_SEQUENCE:

            return jsonify({

                "success": True,

                "ready": False,

                "prediction": None,

                "confidence": 0,

                "frames": current_length,

                "required_frames": FRAMES_PER_SEQUENCE

            })


        # ==================================
        # PREPARE SEQUENCE
        # ==================================

        sequence = np.array(
            sequences[client_id]
        )

        sequence = sequence.reshape(
            1, -1
        )


        # ==================================
        # PREDICTION
        # ==================================

        probabilities = model.predict_proba(
            sequence
        )[0]

        best_index = np.argmax(
            probabilities
        )

        predicted_sign = model.classes_[
            best_index
        ]

        confidence = float(
            probabilities[best_index]
        )


        # ==================================
        # CONFIDENCE CHECK
        # ==================================

        if confidence >= CONFIDENCE_THRESHOLD:

            final_prediction = predicted_sign

        else:

            final_prediction = "unknown"


        # ==================================
        # CLEAR SEQUENCE
        # ==================================

        sequences[client_id].clear()


        return jsonify({

            "success": True,

            "ready": True,

            "prediction": final_prediction,

            "confidence": round(
                confidence,
                4
            ),

            "confidence_percent": round(
                confidence * 100,
                2
            ),

            "frames": FRAMES_PER_SEQUENCE

        })


    except Exception as e:

        print("Prediction error:", e)

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ==========================================
# RESET SEQUENCE
# ==========================================

@app.route("/reset", methods=["POST"])
def reset():

    data = request.get_json(
        silent=True
    ) or {}

    client_id = data.get(
        "client_id",
        "default"
    )

    sequences.pop(
        client_id,
        None
    )

    return jsonify({

        "success": True,

        "message": "Sequence reset"

    })


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    print("\n========================================")
    print("       SIGNBRIDGE ML API")
    print("========================================")

    print("\nServer running at:")
    print("http://localhost:8000")

    print("\nHealth check:")
    print("http://localhost:8000/health")

    print("\nPress CTRL+C to stop.\n")

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )
