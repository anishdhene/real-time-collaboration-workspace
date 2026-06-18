const Workspace = require("../models/Workspace");
const Activity = require("../models/Activity");

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          role: "owner",
        },
      ],
    });

    await Activity.create({
      workspace: workspace._id,
      user: req.user.id,
      action: "created workspace",
      details: name,
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user.id,
    })
      .populate("owner", "username email")
      .populate("members.user", "username email avatar");

    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
};