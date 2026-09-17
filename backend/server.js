const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const signsRoutes = require("./routes/signs");
const conversationRoutes = require("./routes/conversation");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Python ML API
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Increased limit because camera images are sent as Base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SignBridge Backend is running 🚀",
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/signs", signsRoutes);
app.use("/api/conversation", conversationRoutes);

/* =========================
   ML HEALTH CHECK
========================= */

app.get("/api/ml/health", async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/health`);

    if (!response.ok) {
      throw new Error(`ML API returned ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      mlApi: data,
    });
  } catch (error) {
    console.error("ML Health Error:", error.message);

    res.status(503).json({
      success: false,
      message: "ML API is not available",
      error: error.message,
    });
  }
});

/* =========================
   ML SIGN PREDICTION
========================= */

app.post("/api/ml/predict", async (req, res) => {
  try {
    const { image, client_id } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        image,
        client_id: client_id || "signbridge-web",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "ML prediction failed",
        error: data.error || "Unknown ML API error",
      });
    }

    res.json(data);

  } catch (error) {
    console.error("ML Prediction Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not connect to ML API",
      error: error.message,
    });
  }
});

/* =========================
   RESET ML SEQUENCE
========================= */

app.post("/api/ml/reset", async (req, res) => {
  try {
    const { client_id } = req.body;

    const response = await fetch(`${ML_API_URL}/reset`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        client_id: client_id || "signbridge-web",
      }),
    });

    const data = await response.json();

    res.status(response.status).json(data);

  } catch (error) {
    console.error("ML Reset Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not reset ML sequence",
      error: error.message,
    });
  }
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `🚀 SignBridge backend running at http://localhost:${PORT}`
  );

  console.log(
    `🤖 ML API configured at ${ML_API_URL}`
  );
});

