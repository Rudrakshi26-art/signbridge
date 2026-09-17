# 🤟 SignBridge

### Indian Sign Language Communication Platform

SignBridge is a web application that helps people communicate using **Indian Sign Language (ISL)**.

It uses a webcam and **Machine Learning** to recognize hand signs and convert them into text.

---

## ✨ Features

* Real-time sign recognition using a webcam
* Converts signs into text
* Sign Library to learn different signs
* Voice input
* Text-to-speech
* Conversation history
* Text-to-sign support

---

## 🛠️ Technologies Used

### Frontend

* React.js
* Vite
* JavaScript
* HTML
* CSS

### Backend

* Node.js
* Express.js

### Machine Learning

* Python
* MediaPipe
* OpenCV
* Scikit-learn
* Random Forest

---

## 🧠 Machine Learning

The project uses **MediaPipe** to detect hand movements from the webcam.

The hand information is then given to a **Random Forest machine learning model**, which identifies the sign.

Currently, the model recognizes **11 signs**:

* Hello
* Help
* Yes
* No
* Thank You
* Water
* Food
* Doctor
* Sorry
* How Are You
* Please Wait

The model was trained using **220 gesture sequences**.

During model testing, it achieved **88.93% accuracy** in the initial evaluation.

---

## 🔄 How It Works

```text
Webcam
   ↓
React Website
   ↓
Node.js Backend
   ↓
Python ML API
   ↓
MediaPipe
   ↓
Random Forest Model
   ↓
Recognized Sign
   ↓
Text on Screen
```

---

## 📁 Project Structure

```text
signbridge/
│
├── frontend/
├── backend/
├── ml/
└── .gitignore
```

* **frontend** → React website
* **backend** → Node.js and Express API
* **ml** → Python machine learning code

---

## 🚀 How to Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

Open another terminal:

```bash
cd backend
npm install
npm start
```

### ML API

Open another terminal:

```cmd
cd ml
venv\Scripts\activate
python ml_api.py
```

The three parts should be running together.

---

## 📸 Screenshots

Add screenshots of the project here.

### Home Page

![Home Page](screenshots/home.png)

### Communication Page

![Communication Page](screenshots/communicate.png)

### Sign Library

![Sign Library](screenshots/library.png)
---


GitHub:
https://github.com/Rudrakshi26-art
