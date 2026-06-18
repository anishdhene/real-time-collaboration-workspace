const Activity = require("../models/Activity");

const getActivities = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const activities = await Activity.find({ workspace: workspaceId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActivities,
};
