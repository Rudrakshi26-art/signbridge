import cv2
import mediapipe as mp
import csv
import os
import time
import math


# =========================================================
# SETTINGS
# =========================================================

SIGNS = [
    "hello",
    "help",
    "yes",
    "no",
    "thank-you",
    "water",
    "food",
    "doctor",
    "sorry",
    "how-are-you",
    "please-wait",
]

# Number of complete gesture sequences in one batch
SEQUENCES_PER_BATCH = 20

# Total target sequences for each sign
TOTAL_SEQUENCES_PER_SIGN = 200

# How long each gesture recording lasts
RECORDING_SECONDS = 2.0

# Number of frames stored for every sequence
FRAMES_PER_SEQUENCE = 30

DATASET_DIR = "dataset"


# =========================================================
# MEDIAPIPE
# =========================================================

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
)


# =========================================================
# NORMALIZE HAND LANDMARKS
# =========================================================

def normalize_hand(landmarks):
    """
    Convert 21 hand landmarks into normalized coordinates
    relative to the wrist.
    """

    wrist = landmarks[0]

    points = []

    for landmark in landmarks:
        x = landmark.x - wrist.x
        y = landmark.y - wrist.y
        z = landmark.z - wrist.z

        points.append((x, y, z))

    max_distance = 0

    for x, y, z in points:

        distance = math.sqrt(
            x * x +
            y * y +
            z * z
        )

        if distance > max_distance:
            max_distance = distance

    if max_distance == 0:
        max_distance = 1

    normalized = []

    for x, y, z in points:

        normalized.extend([
            x / max_distance,
            y / max_distance,
            z / max_distance,
        ])

    return normalized


# =========================================================
# EXTRACT FEATURES
# =========================================================

def extract_features(results):

    left_hand = [0.0] * 63
    right_hand = [0.0] * 63

    if not results.multi_hand_landmarks:
        return left_hand + right_hand

    for index, hand_landmarks in enumerate(
        results.multi_hand_landmarks
    ):

        normalized = normalize_hand(
            hand_landmarks.landmark
        )

        handedness = results.multi_handedness[index]

        label = handedness.classification[0].label

        if label == "Left":
            left_hand = normalized

        elif label == "Right":
            right_hand = normalized

    return left_hand + right_hand


# =========================================================
# CREATE CSV
# =========================================================

def create_csv(sign_name):

    sign_dir = os.path.join(
        DATASET_DIR,
        sign_name
    )

    os.makedirs(
        sign_dir,
        exist_ok=True
    )

    csv_path = os.path.join(
        sign_dir,
        "sequences.csv"
    )

    file_exists = os.path.exists(csv_path)

    file = open(
        csv_path,
        "a",
        newline=""
    )

    writer = csv.writer(file)

    if not file_exists:

        header = [
            "sequence_id",
            "frame",
            "label",
        ]

        for hand in ["left", "right"]:

            for point in range(21):

                header.extend([
                    f"{hand}_{point}_x",
                    f"{hand}_{point}_y",
                    f"{hand}_{point}_z",
                ])

        writer.writerow(header)

    return file, writer, csv_path


# =========================================================
# GET EXISTING SEQUENCE COUNT
# =========================================================

def get_existing_sequences(csv_path):

    if not os.path.exists(csv_path):
        return 0

    sequence_ids = set()

    with open(
        csv_path,
        "r",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            sequence_ids.add(
                row["sequence_id"]
            )

    return len(sequence_ids)


# =========================================================
# COUNTDOWN
# =========================================================

def countdown(seconds=3):

    start = time.time()

    while True:

        elapsed = time.time() - start

        remaining = seconds - int(elapsed)

        if remaining <= 0:
            break

        success, frame = camera.read()

        if not success:
            continue

        frame = cv2.flip(
            frame,
            1
        )

        cv2.rectangle(
            frame,
            (0, 0),
            (
                frame.shape[1],
                frame.shape[0]
            ),
            (20, 20, 20),
            -1
        )

        cv2.putText(
            frame,
            "GET READY",
            (
                int(frame.shape[1] * 0.32),
                int(frame.shape[0] * 0.40)
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.3,
            (255, 255, 255),
            3
        )

        cv2.putText(
            frame,
            str(remaining),
            (
                int(frame.shape[1] * 0.47),
                int(frame.shape[0] * 0.58)
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            2.5,
            (255, 255, 255),
            5
        )

        cv2.imshow(
            "SignBridge - ISL Dataset Collection",
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            return False

    return True


# =========================================================
# RECORD ONE SEQUENCE
# =========================================================

def record_sequence(
    sign_name,
    sequence_number,
    total_sequences
):

    print()
    print(
        f"Preparing sequence "
        f"{sequence_number}/{total_sequences}"
    )

    print(
        "Perform the complete gesture when recording starts."
    )

    if not countdown(3):
        return None


    print(
        f"Recording sequence "
        f"{sequence_number}/{total_sequences}..."
    )


    collected_features = []

    start_time = time.time()

    while (
        time.time() - start_time
        < RECORDING_SECONDS
    ):

        success, frame = camera.read()

        if not success:
            continue

        frame = cv2.flip(
            frame,
            1
        )

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        results = hands.process(
            rgb_frame
        )


        # Draw landmarks
        if results.multi_hand_landmarks:

            for hand_landmarks in (
                results.multi_hand_landmarks
            ):

                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS
                )


        if results.multi_hand_landmarks:

            features = extract_features(
                results
            )

            collected_features.append(
                features
            )


        # Screen information
        elapsed = time.time() - start_time

        remaining = max(
            0,
            RECORDING_SECONDS - elapsed
        )

        cv2.rectangle(
            frame,
            (10, 10),
            (610, 120),
            (20, 20, 20),
            -1
        )

        cv2.putText(
            frame,
            f"Sign: {sign_name}",
            (25, 42),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.75,
            (255, 255, 255),
            2
        )

        cv2.putText(
            frame,
            f"Sequence: {sequence_number}/{total_sequences}",
            (25, 72),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )

        cv2.putText(
            frame,
            f"Recording: {remaining:.1f}s",
            (25, 102),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )

        cv2.imshow(
            "SignBridge - ISL Dataset Collection",
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            return None


    # =====================================================
    # VALIDATION
    # =====================================================

    if len(collected_features) < 5:

        print(
            "WARNING: Not enough hand data was detected."
        )

        print(
            "This sequence will NOT be saved."
        )

        return []


    # =====================================================
    # RESAMPLE TO FIXED NUMBER OF FRAMES
    # =====================================================

    total_frames = len(
        collected_features
    )

    if total_frames == FRAMES_PER_SEQUENCE:

        selected_frames = collected_features

    else:

        selected_frames = []

        for i in range(FRAMES_PER_SEQUENCE):

            position = (
                i *
                (total_frames - 1) /
                (FRAMES_PER_SEQUENCE - 1)
            )

            index = int(
                round(position)
            )

            index = max(
                0,
                min(
                    index,
                    total_frames - 1
                )
            )

            selected_frames.append(
                collected_features[index]
            )


    return selected_frames


# =========================================================
# SAVE SEQUENCE
# =========================================================

def save_sequence(
    writer,
    sequence_id,
    sign_name,
    frames
):

    for frame_number, features in enumerate(
        frames
    ):

        writer.writerow([
            sequence_id,
            frame_number,
            sign_name,
            *features,
        ])


# =========================================================
# SIGN MENU
# =========================================================

def show_menu():

    print()
    print("=" * 65)
    print("SIGNBRIDGE - ISL DATASET COLLECTION")
    print("=" * 65)
    print()

    for index, sign in enumerate(
        SIGNS,
        start=1
    ):

        print(
            f"{index:2}. {sign}"
        )

    print()
    print("Q. Quit")
    print()
    print("=" * 65)


# =========================================================
# CAMERA
# =========================================================

camera = cv2.VideoCapture(0)

if not camera.isOpened():

    print(
        "ERROR: Could not open webcam."
    )

    hands.close()

    exit()


# =========================================================
# MAIN PROGRAM
# =========================================================

while True:

    show_menu()

    choice = input(
        "Select a sign number: "
    ).strip().lower()


    # -----------------------------------------------------
    # QUIT
    # -----------------------------------------------------

    if choice == "q":
        break


    # -----------------------------------------------------
    # VALIDATE NUMBER
    # -----------------------------------------------------

    if not choice.isdigit():

        print(
            "Please enter a valid number."
        )

        continue


    sign_index = int(choice) - 1

    if (
        sign_index < 0
        or sign_index >= len(SIGNS)
    ):

        print(
            "Invalid sign number."
        )

        continue


    sign_name = SIGNS[sign_index]


    # =====================================================
    # CSV
    # =====================================================

    csv_file, writer, csv_path = create_csv(
        sign_name
    )


    existing_sequences = (
        get_existing_sequences(
            csv_path
        )
    )


    if existing_sequences >= TOTAL_SEQUENCES_PER_SIGN:

        print()
        print(
            f"{sign_name} already has "
            f"{existing_sequences} sequences."
        )

        print(
            "This sign is complete."
        )

        csv_file.close()

        continue


    # =====================================================
    # BATCH
    # =====================================================

    remaining = (
        TOTAL_SEQUENCES_PER_SIGN
        - existing_sequences
    )

    current_batch_size = min(
        SEQUENCES_PER_BATCH,
        remaining
    )

    print()
    print("=" * 65)
    print(
        f"SIGN: {sign_name.upper()}"
    )
    print(
        f"Existing: "
        f"{existing_sequences}/"
        f"{TOTAL_SEQUENCES_PER_SIGN}"
    )
    print(
        f"This batch: "
        f"{current_batch_size} sequences"
    )
    print("=" * 65)

    print()
    print("Important:")
    print("- Perform the complete gesture.")
    print("- Keep your hands clearly visible.")
    print("- Use the same gesture meaning every time.")
    print("- Small natural variations are okay.")
    print("- Perform movement signs naturally.")
    print()
    print(
        "Press Q during recording to quit."
    )

    input(
        "\nPress ENTER when you are ready..."
    )


    # =====================================================
    # COLLECT BATCH
    # =====================================================

    batch_completed = 0

    while batch_completed < current_batch_size:

        sequence_number = (
            existing_sequences
            + batch_completed
            + 1
        )

        frames = record_sequence(
            sign_name,
            sequence_number,
            TOTAL_SEQUENCES_PER_SIGN
        )


        # -------------------------------------------------
        # QUIT
        # -------------------------------------------------

        if frames is None:

            csv_file.close()

            camera.release()
            cv2.destroyAllWindows()
            hands.close()

            print()
            print(
                "Dataset collection stopped."
            )

            exit()


        # -------------------------------------------------
        # INVALID SEQUENCE
        # -------------------------------------------------

        if len(frames) == 0:

            print()
            print(
                "Sequence discarded."
            )

            print(
                "Please try the same sequence again."
            )

            continue


        # -------------------------------------------------
        # SAVE
        # -------------------------------------------------

        save_sequence(
            writer,
            sequence_number,
            sign_name,
            frames
        )

        csv_file.flush()

        batch_completed += 1

        print()
        print(
            f"✓ Saved sequence "
            f"{sequence_number}/"
            f"{TOTAL_SEQUENCES_PER_SIGN}"
        )

        print(
            f"Batch progress: "
            f"{batch_completed}/"
            f"{current_batch_size}"
        )


    # =====================================================
    # BATCH COMPLETE
    # =====================================================

    csv_file.close()

    total_now = (
        existing_sequences
        + batch_completed
    )

    print()
    print("=" * 65)
    print(
        f"✓ BATCH COMPLETE — {sign_name.upper()}"
    )
    print("=" * 65)

    print(
        f"Total collected: "
        f"{total_now}/"
        f"{TOTAL_SEQUENCES_PER_SIGN}"
    )

    print()
    print(
        "Take a short break if needed."
    )


    # =====================================================
    # WHAT NEXT?
    # =====================================================

    if total_now >= TOTAL_SEQUENCES_PER_SIGN:

        print()
        print(
            f"✓ {sign_name} is COMPLETE!"
        )

        print(
            "You can choose another sign."
        )

        continue


    print()
    print("What would you like to do?")
    print()
    print(
        "ENTER = Collect another batch of 20"
    )
    print(
        "N     = Choose another sign"
    )
    print(
        "Q     = Quit"
    )

    next_action = input(
        "\nYour choice: "
    ).strip().lower()


    if next_action == "q":

        break


    elif next_action == "n":

        continue


    else:

        # Continue with the same sign
        # automatically.
        continue


# =========================================================
# CLEANUP
# =========================================================

camera.release()

cv2.destroyAllWindows()

hands.close()

print()
print("=" * 65)
print("SIGNBRIDGE DATA COLLECTION CLOSED")
print("=" * 65)
print()

