const signs = require("../data/signs");

/* =========================
   GET ALL SIGNS
========================= */

const getAllSigns = (req, res) => {
  res.json({
    success: true,
    count: signs.length,
    data: signs,
  });
};

/* =========================
   GET SINGLE SIGN
========================= */

const getSignById = (req, res) => {
  const id = Number(req.params.id);

  const sign = signs.find((item) => item.id === id);

  if (!sign) {
    return res.status(404).json({
      success: false,
      message: "Sign not found",
    });
  }

  res.json({
    success: true,
    data: sign,
  });
};

/* =========================
   SEARCH SIGNS
========================= */

const searchSigns = (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();

  if (!query) {
    return res.json({
      success: true,
      count: signs.length,
      data: signs,
    });
  }

  const results = signs.filter((sign) =>
    sign.name.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
};

/* =========================
   GET BY CATEGORY
========================= */

const getSignsByCategory = (req, res) => {
  const category = req.params.category.toLowerCase();

  const results = signs.filter(
    (sign) => sign.category.toLowerCase() === category
  );

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
};

/* =========================
   RECOGNIZE SIGN
   TEMPORARY DEMO API
========================= */

const recognizeSign = (req, res) => {
  const { sign } = req.body;

  if (!sign) {
    return res.status(400).json({
      success: false,
      message: "Sign is required",
    });
  }

  const detectedSign = signs.find(
    (item) => item.name.toLowerCase() === sign.toLowerCase()
  );

  if (!detectedSign) {
    return res.status(404).json({
      success: false,
      message: "Sign not found in the current dataset",
    });
  }

  res.json({
    success: true,
    data: {
      id: detectedSign.id,
      sign: detectedSign.name,
      text: detectedSign.name,
      confidence: 0.95,
      image: detectedSign.image,
    },
  });
};

module.exports = {
  getAllSigns,
  getSignById,
  searchSigns,
  getSignsByCategory,
  recognizeSign,
};