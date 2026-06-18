const Channel = require("../models/Channel");
const Workspace = require("../models/Workspace");
const Activity = require("../models/Activity");

const createChannel = async (req, res) => {
  try {
    const { name, workspaceId } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const member = workspace.members.find(
      (entry) => entry.user.toString() === req.user.id
    );

    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const channel = await Channel.create({
      name,
      workspace: workspaceId,
      createdBy: req.user.id,
    });

    await Activity.create({
      workspace: workspaceId,
      user: req.user.id,
      action: "created channel",
      details: name,
    });

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getChannels = async (req, res) => {
  try {
    const { workspaceId } = req.params;

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

    const channels = await Channel.find({
      workspace: workspaceId,
    });

    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createChannel,
  getChannels,
};