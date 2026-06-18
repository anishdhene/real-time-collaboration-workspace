const Task = require("../models/Task");
const Workspace = require("../models/Workspace");

const getTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const tasks = await Task.find({ workspace: workspaceId })
      .populate("assignedTo", "username avatar")
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { workspaceId, title, description, assignedTo } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const member = workspace.members.find(
      (entry) => entry.user.toString() === req.user.id
    );

    if (!member) {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = await Task.create({
      workspace: workspaceId,
      title,
      description,
      assignedTo,
      createdBy: req.user.id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "username avatar")
      .populate("createdBy", "username avatar");

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    Object.assign(task, updates);
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "username avatar")
      .populate("createdBy", "username avatar");

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
