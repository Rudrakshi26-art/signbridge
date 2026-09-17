const express = require("express");

const {
  getConversation,
  sendMessage,
  clearConversation,
} = require("../controllers/conversationController");

const router = express.Router();

/* =========================
   GET CONVERSATION
========================= */

router.get("/", getConversation);

/* =========================
   SEND MESSAGE
========================= */

router.post("/message", sendMessage);

/* =========================
   CLEAR CONVERSATION
========================= */

router.delete("/", clearConversation);

module.exports = router;