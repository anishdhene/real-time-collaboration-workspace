const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
    type: String,
    },

    fileType: {
    type: String,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    replyTo: {

  type:
    mongoose.Schema.Types.ObjectId,

  ref:
    "Message",

},

    edited: {
    type: Boolean,
    default: false,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },

    reactions: [
  {
    emoji: {
      type: String,
    },

    users: [
      {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },
    ],
  },
],

  },
  {
    timestamps: true,
  }

  

);

module.exports = mongoose.model(
  "Message",
  messageSchema
);

