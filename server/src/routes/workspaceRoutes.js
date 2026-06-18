const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createWorkspace,
  getUserWorkspaces,
} = require("../controllers/workspaceController");

router.post("/", protect, createWorkspace);

router.get("/", protect, getUserWorkspaces);

module.exports = router;