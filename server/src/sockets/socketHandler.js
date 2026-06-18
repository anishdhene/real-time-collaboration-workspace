const User =
  require("../models/User");

const Message =
  require("../models/Message");

const Channel =
  require("../models/Channel");

const Workspace =
  require("../models/Workspace");

const Notification =
  require("../models/Notification");

const Activity =
  require("../models/Activity");

const onlineUsers = {};

const socketHandler = (io) => {

  io.on(
    "connection",
    (socket) => {

      console.log(
        "User connected:",
        socket.id
      );

      // REGISTER USER
      socket.on(
        "register_user",
        async (userId) => {

          console.log(
            "REGISTER EVENT RECEIVED:",
            userId
          );

          onlineUsers[userId] =
            socket.id;

          console.log(
            "ONLINE USERS:",
            onlineUsers
          );

          const onlineUserIds =
            Object.keys(
              onlineUsers
            );

          const users =
            await User.find({
              _id: {
                $in:
                  onlineUserIds,
              },
            }).select(
              "username email"
            );

          io.emit(
            "online_users",
            users
          );

        }
      );

      // JOIN CHANNEL
      socket.on(
        "join_channel",
        (channelId) => {

          socket.join(
            channelId
          );

          console.log(
            `Socket ${socket.id} joined ${channelId}`
          );

        }
      );

      // SEND MESSAGE
      socket.on(
        "send_message",
        async (data) => {

          try {

            const {
              content,
              channelId,
              senderId,
              fileUrl,
              fileType,
              replyTo,
            } = data;

            const channel =
              await Channel.findById(
                channelId
              );

            if (!channel)
              return;

            const workspace =
              await Workspace.findById(
                channel.workspace
              );

            if (!workspace)
              return;

            const member =
              workspace.members.find(
                (entry) =>
                  entry.user.toString() ===
                  senderId
              );

            if (!member)
              return;

            const message =
              await Message.create({
                content,
                fileUrl,

                fileType,
                replyTo,

                sender:
                  senderId,
                workspace:
                  workspace._id,
                channel:
                  channelId,
              });

            const populatedMessage =
              await Message.findById(
                message._id
              )
                .populate(
                  "sender",
                  "username email avatar"
                )
                .populate(
                  "channel",
                  "name"
                )
                .populate({
                  path:
                    "replyTo",
                  populate: {
                    path:
                      "sender",
                    select:
                      "username",
                  },
                });

            const mentionMatches =
              content.match(
                /@([a-zA-Z0-9_]+)/g
              ) || [];

            for (const match of mentionMatches) {
              const username =
                match.slice(1);

              const mentionedUser =
                await User.findOne({
                  username,
                });

              if (
                mentionedUser &&
                mentionedUser._id.toString() !==
                  senderId
              ) {
                const notification =
                  await Notification.create({
                    workspace:
                      workspace._id,
                    user:
                      mentionedUser._id,
                    sender:
                      senderId,
                    type: "mention",
                    message: `${content}`,
                    relatedMessage:
                      populatedMessage._id,
                  });

                if (
                  onlineUsers[
                    mentionedUser._id.toString()
                  ]
                ) {
                  io.to(
                    onlineUsers[
                      mentionedUser._id.toString()
                    ]
                  ).emit(
                    "new_notification",
                    notification
                  );
                }
              }
            }

            await Activity.create({
              workspace:
                workspace._id,
              user:
                senderId,
              action:
                "sent message",
              details:
                `${content.slice(0, 80)}${
                  content.length > 80 ? "..." : ""
                }`,
            });

            io.to(
              channelId
            ).emit(
              "receive_message",
              populatedMessage
            );

          } catch (error) {

            console.log(
              error
            );

          }

        }
      );


// ADD REACTION
socket.on(
  "add_reaction",
  async (data) => {

    try {

      const {
        messageId,
        emoji,
        userId,
      } = data;

      const message =
        await Message.findById(
          messageId
        );

      if (!message) return;

      let reaction =
        message.reactions.find(
          (r)=>
            r.emoji === emoji
        );

      if (!reaction) {

        message.reactions.push({
          emoji,
          users:[userId],
        });

      } else {

        const alreadyReacted =
          reaction.users.some(
            (id)=>
              id.toString() ===
              userId
          );

        if (alreadyReacted) {

          reaction.users =
            reaction.users.filter(
              (id)=>
                id.toString() !==
                userId
            );

        } else {

          reaction.users.push(
            userId
          );

        }

      }

      await message.save();

      const updatedMessage =
        await Message.findById(
          messageId
        )
          .populate(
            "sender",
            "username email avatar"
          );

      io.to(
        message.channel.toString()
      ).emit(
        "reaction_updated",
        updatedMessage
      );

    } catch(error){

      console.log(error);

    }

  }
);

// EDIT MESSAGE

socket.on(
  "edit_message",
  async (data) => {

    try {

      const {
        messageId,
        content,
        userId,
      } = data;

      const message =
        await Message.findById(
          messageId
        );

      if (!message) return;

      if (
        message.sender.toString()
        !== userId
      ) return;

      message.content =
        content;

      message.edited = true;

      await message.save();

      const updatedMessage =
        await Message.findById(
          messageId
        )
          .populate(
            "sender",
            "username email"
          );

      io.to(
        message.channel.toString()
      ).emit(
        "message_updated",
        updatedMessage
      );

    } catch(error){

      console.log(error);

    }

  }
);


// DELETE MESSAGE

socket.on(
  "delete_message",
  async (data) => {

    try {

      const {
        messageId,
        userId,
      } = data;

      const message =
        await Message.findById(
          messageId
        );

      if (!message) return;

      if (
        message.sender.toString()
        !== userId
      ) return;

      await Message.findByIdAndDelete(
        messageId
      );

      io.to(
        message.channel.toString()
      ).emit(
        "message_deleted",
        messageId
      );

    } catch(error){

      console.log(error);

    }

  }
);

// TYPING EVENT
socket.on(
        "typing",
        ({
          channelId,
          username,
        }) => {

          socket
            .to(channelId)
            .emit(
              "user_typing",
              username
            );

        }
      );

      // STOP TYPING EVENT
      socket.on(
        "stop_typing",
        ({
          channelId,
        }) => {

          socket
            .to(channelId)
            .emit(
              "user_stop_typing"
            );

        }
      );

      // DISCONNECT
      socket.on(
        "disconnect",
        async () => {

          console.log(
            "User disconnected:",
            socket.id
          );

          for (
            const userId
            in onlineUsers
          ) {

            if (
              onlineUsers[
                userId
              ] ===
              socket.id
            ) {

              delete onlineUsers[
                userId
              ];

            }

          }

          const onlineUserIds =
            Object.keys(
              onlineUsers
            );

          const users =
            await User.find({
              _id: {
                $in:
                  onlineUserIds,
              },
            }).select(
              "username email"
            );

          io.emit(
            "online_users",
            users
          );

        }
      );

    }
  );

};

module.exports =
  socketHandler;