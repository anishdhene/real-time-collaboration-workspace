const express = require("express");
const router = express.Router();

const Workspace = require("../models/Workspace");
const User = require("../models/User");
const Activity = require("../models/Activity");
const protect = require("../middleware/authMiddleware");

router.post("/invite", protect, async (req, res) => {
  try {
    const { workspaceId, email } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const inviter = workspace.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (!inviter || !["owner", "admin"].includes(inviter.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyMember = workspace.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "User already member" });
    }

    workspace.members.push({
      user: user._id,
      role: "member",
    });

    await workspace.save();

    await Activity.create({
      workspace: workspaceId,
      user: req.user.id,
      action: "invited member",
      details: user.email,
    });

    res.status(200).json({
      message: "Member added",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/:workspaceId/promote", protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userId } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const owner = workspace.members.find(
      (member) => member.user.toString() === req.user.id && member.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({ message: "Only owner can promote members" });
    }

    const member = workspace.members.find(
      (entry) => entry.user.toString() === userId
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.role = "admin";
    await workspace.save();

    await Activity.create({
      workspace: workspaceId,
      user: req.user.id,
      action: "promoted member to admin",
      details: userId,
    });

    res.status(200).json({ message: "Member promoted to admin", workspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;