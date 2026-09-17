let conversations = [];

/* =========================
   GET CONVERSATION
========================= */

const getConversation = (req, res) => {
  res.json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
};

/* =========================
   SEND MESSAGE
========================= */

const sendMessage = (req, res) => {
  const {
    sender,
    type,
    text,
    sign,
    image,
  } = req.body;

  if (!sender) {
    return res.status(400).json({
      success: false,
      message: "Sender is required",
    });
  }

  if (!text && !sign) {
    return res.status(400).json({
      success: false,
      message: "Message text or sign is required",
    });
  }

  const message = {
    id: Date.now(),
    sender,
    type: type || "text",
    text: text || "",
    sign: sign || null,
    image: image || null,
    createdAt: new Date().toISOString(),
  };

  conversations.push(message);

  res.status(201).json({
    success: true,
    data: message,
  });
};

/* =========================
   CLEAR CONVERSATION
========================= */

const clearConversation = (req, res) => {
  conversations = [];

  res.json({
    success: true,
    message: "Conversation cleared successfully",
  });
};

module.exports = {
  getConversation,
  sendMessage,
  clearConversation,
};