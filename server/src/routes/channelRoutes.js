const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createChannel,
  getChannels,
} = require("../controllers/channelController");

router.post("/", protect, createChannel);
router.get("/:workspaceId", protect, getChannels);

module.exports = router;