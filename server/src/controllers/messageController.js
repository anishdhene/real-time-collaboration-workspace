const Message = require("../models/Message");
const Channel = require("../models/Channel");
const Workspace = require("../models/Workspace");

const sendMessage = async (req, res) => {
  try {
    const { content, channelId } = req.body;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        message: "Channel not found",
      });
    }

    const workspace = await Workspace.findById(channel.workspace);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const member = workspace.members.find(
      (entry) => entry.user.toString() === req.user.id
    );

    if (!member) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const message = await Message.create({
      content,
      sender: req.user.id,
      workspace: workspace._id,
      channel: channelId,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username email avatar")
      .populate("channel", "name");

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const workspace = await Workspace.findById(channel.workspace);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const member = workspace.members.find(
      (entry) => entry.user.toString() === req.user.id
    );

    if (!member) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({
      channel: channelId,
    })
      .populate("sender", "username email avatar")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};