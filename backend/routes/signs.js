const express = require("express");

const {
  getAllSigns,
  getSignById,
  searchSigns,
  getSignsByCategory,
  recognizeSign,
} = require("../controllers/signController");

const router = express.Router();

/* =========================
   GET ALL SIGNS
   GET /api/signs
========================= */

router.get("/", getAllSigns);

/* =========================
   SEARCH SIGNS
   GET /api/signs/search?q=hello
========================= */

router.get("/search", searchSigns);

/* =========================
   CATEGORY
   GET /api/signs/category/Everyday
========================= */

router.get("/category/:category", getSignsByCategory);

/* =========================
   SIGN RECOGNITION
   POST /api/signs/recognize
========================= */

router.post("/recognize", recognizeSign);

/* =========================
   GET SINGLE SIGN
   GET /api/signs/1
========================= */

router.get("/:id", getSignById);

module.exports = router;