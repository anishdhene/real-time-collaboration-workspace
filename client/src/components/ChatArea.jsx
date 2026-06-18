import {
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../services/socket";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ChatArea({ selectedChannel }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [selectedFile, setSelectedFile] =
  useState(null);

  const [editingId, setEditingId] =
  useState(null);

const [editedText, setEditedText] =
  useState("");

  const messagesEndRef = useRef(null);
  const { token, user } = useAuth();

  const [replyingTo, setReplyingTo] =
  useState(null);

  const [searchTerm, setSearchTerm] =
  useState("");

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (username = "") => {
    return username
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    if (!user) return;
    socket.emit("register_user", user.id);
  }, [user]);

  useEffect(() => {
    if (!selectedChannel) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await api.get(
          `/messages/${selectedChannel._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMessages(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchMessages();

    socket.emit("join_channel", selectedChannel._id);

    socket.on(
  "receive_message",
  (data)=>{

    console.log(
      "NEW MESSAGE:",
      data
    );

    setMessages(
      (prev)=>[
        ...prev,
        data
      ]
    );

  }
);

    socket.on(
  "reaction_updated",
  (updatedMessage) => {

    setMessages(
      (prev) =>

        prev.map(
          (msg) =>

            msg._id ===
            updatedMessage._id

              ? updatedMessage

              : msg
        )
    );

  }
);

    socket.on(
  "message_updated",
  (updatedMessage) => {

    setMessages(
      (prev)=>

        prev.map(
          (msg)=>

            msg._id ===
            updatedMessage._id

              ? updatedMessage

              : msg
        )
    );

  }
);

socket.on(
  "message_deleted",
  (messageId) => {

    setMessages(
      (prev)=>

        prev.filter(
          (msg)=>

            msg._id !==
            messageId
        )
    );

  }
);

    socket.on("user_typing", (username) => {
      setTypingUser(username);
    });

    socket.on("user_stop_typing", () => {
      setTypingUser("");
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    

    return () => {
      socket.off("receive_message");
      socket.off("reaction_updated");

      socket.off("message_updated");

      socket.off("message_deleted");

      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("online_users");
    };
  }, [selectedChannel, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedChannel) return;

    const timer = setTimeout(() => {
      socket.emit("stop_typing", {
        channelId: selectedChannel._id,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [message, selectedChannel]);

  const handleMessageChange = (event) => {
    const nextMessage = event.target.value;
    setMessage(nextMessage);

    if (selectedChannel && user && nextMessage.trim()) {
      socket.emit("typing", {
        channelId: selectedChannel._id,
        username: user.username || "Someone",
      });
    }
  };

  const uploadFile = async () => {

  if (!selectedFile)
    return null;

  const formData =
    new FormData();

  formData.append(
    "file",
    selectedFile
  );

  try {

    const response =
      await api.post(
        "/upload",
        formData,
        {
          headers:{
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return response.data;

  } catch(error){

    console.log(error);

    return null;

  }

};

  const sendMessage =
  async () => {

    if (
      !selectedChannel ||
      !user
    ) return;

    if (
      !message.trim() &&
      !selectedFile
    ) return;

    let uploadData =
      null;

    if (
      selectedFile
    ) {

      uploadData =
        await uploadFile();

    }

    console.log({

  message,

  selectedFile,

  uploadData,

});

    socket.emit(
      "send_message",
      {

        content:
          message,

        channelId:
          selectedChannel._id,

        senderId:
          user.id,

        fileUrl:
          uploadData?.fileUrl,

        fileType:
          uploadData?.fileType,

        replyTo:
  replyingTo?._id,  

      }
    );

    setMessage("");

    setReplyingTo(
  null
);

    setSelectedFile(
      null
    );

  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      <div className="border-b border-zinc-800 p-4">
        <div className="text-xl font-semibold">
          {selectedChannel ? `# ${selectedChannel.name}` : "Select Channel"}
        </div>
        <div className="mt-4">
          <p className="text-green-400 font-semibold">🟢 Online Users</p>
          <div className="mt-2 space-y-2">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((onlineUser) => (
                <div key={onlineUser._id} className="text-sm text-zinc-300">
                  🟢 {onlineUser.username}
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-500">No users online</div>
            )}
          </div>
        </div>
      </div>

      
      
      <div className="mt-4">

  <input
    type="text"
    placeholder="🔍 Search messages..."
    value={searchTerm}
    onChange={(e)=>

      setSearchTerm(
        e.target.value
      )

    }
    className="w-full rounded-lg border border-zinc-400 bg-zinc-450 px-4 py-2 text-sm text-white outline-none"
  />

</div>

      {selectedChannel ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-zinc-500">No messages in this channel yet.</div>
            ) : (
              <>
                {messages
                  .filter((messageItem) => {
                    if (!searchTerm.trim()) return true;
                    const search = searchTerm.toLowerCase();
                    return (
                      messageItem.content?.toLowerCase().includes(search) ||
                      messageItem.sender?.username?.toLowerCase().includes(search)
                    );
                  })
                  .map((messageItem) => (
                    <div
                      key={messageItem._id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-bold text-white">
                          {messageItem.sender?.avatar ? (
                            <img
                              src={messageItem.sender.avatar}
                              alt="avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(messageItem.sender?.username || "?")
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {messageItem.sender?.username || "Unknown"}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {formatTime(messageItem.createdAt)}
                            {messageItem.edited && (
                              <span className="ml-2 text-yellow-400">(edited)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {messageItem.replyTo && (
                        <div className="mt-3 mb-3 rounded-lg border-l-4 border-indigo-500 bg-zinc-800 p-3">
                          <p className="text-xs text-zinc-500">
                            Reply to {messageItem.replyTo?.sender?.username}
                          </p>
                          <p className="text-sm text-zinc-300">{messageItem.replyTo?.content}</p>
                        </div>
                      )}

                      {editingId === messageItem._id ? (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="flex-1 rounded bg-zinc-800 px-3 py-2 text-white"
                          />
                          <button
                            onClick={() => {
                              socket.emit("edit_message", {
                                messageId: messageItem._id,
                                content: editedText,
                                userId: user.id,
                              });
                              setEditingId(null);
                            }}
                            className="bg-green-600 px-3 py-2 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setReplyingTo(messageItem)}
                            className="text-blue-400 text-sm"
                          >
                            ↩ Reply
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mt-3">
                            {messageItem.content && (
                              <p className="text-zinc-100">{messageItem.content}</p>
                            )}
                            {messageItem.fileUrl &&
                              (messageItem.fileType?.startsWith("image/") ? (
                                <img
                                  src={messageItem.fileUrl}
                                  alt="upload"
                                  className="mt-3 rounded-lg max-h-64"
                                />
                              ) : (
                                <a
                                  href={messageItem.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 underline"
                                >
                                  📄 Download File
                                </a>
                              ))}
                          </div>

                          {messageItem.sender?._id === user.id && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingId(messageItem._id);
                                  setEditedText(messageItem.content || "");
                                }}
                                className="text-yellow-400 text-sm"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  socket.emit("delete_message", {
                                    messageId: messageItem._id,
                                    userId: user.id,
                                  });
                                }}
                                className="text-red-400 text-sm"
                              >
                                🗑 Delete
                              </button>
                              <button
                                onClick={() => setReplyingTo(messageItem)}
                                className="text-blue-400 text-sm"
                              >
                                ↩ Reply
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      <div className="mt-3 flex gap-2">
                        {["👍", "❤️", "😂", "🔥"].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              socket.emit("add_reaction", {
                                messageId: messageItem._id,
                                emoji,
                                userId: user.id,
                              });
                            }}
                            className="rounded-full bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
                          >
                            {emoji} {messageItem.reactions?.find((r) => r.emoji === emoji)?.users?.length || 0}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-zinc-800 p-4">
            {typingUser && (
              <div className="mb-3 text-sm text-zinc-400">
                {typingUser} is typing...
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                disabled={!selectedChannel}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    
                    sendMessage();
                  }
                }}
                placeholder={
                  selectedChannel
                    ? "Type your message..."
                    : "Select a channel to start chatting"
                }
                className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-800"
              />

              <label
  className="cursor-pointer rounded-md bg-zinc-800 px-4 py-3 hover:bg-zinc-700"
>
{replyingTo && (

  <div className="mb-3 rounded-lg bg-zinc-900 p-3 border border-zinc-800">

    <div className="flex justify-between">

      <div>

        <p className="text-xs text-zinc-500">

          Replying to

          {" "}

          {
            replyingTo.sender
              ?.username
          }

        </p>

        <p className="text-sm text-zinc-300">

          {
            replyingTo.content
          }

        </p>

      </div>

      <button
        onClick={() => {

          setReplyingTo(
            null
          );

        }}
        className="text-red-400"
      >

        ✕
      </button>

    </div>

  </div>

)}
  📎

  <input
    type="file"
    hidden
    onChange={(e)=>{

  console.log(
    "FILE SELECTED:",
    e.target.files[0]
  );

  setSelectedFile(
    e.target.files[0]
  );

}}
  />

</label>

              <button
                type="button"
                onClick={sendMessage}
                className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
                disabled={
  !selectedChannel ||
  (
    !message.trim() &&
    !selectedFile
  )
}
              >
                Send
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 text-zinc-500">
          Select a channel to start chatting.
        </div>
      )}
    </div>
  );
}

export default ChatArea;
    