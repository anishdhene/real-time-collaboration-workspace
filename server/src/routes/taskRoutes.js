const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.get("/:workspaceId", protect, getTasks);
router.post("/", protect, createTask);
router.put("/:taskId", protect, updateTask);
router.delete("/:taskId", protect, deleteTask);

module.exports = router;
