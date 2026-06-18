import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";

function Sidebar({
  selectedWorkspace,
  selectedChannel,
  setSelectedChannel,
}) {
  const [channels, setChannels] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [panel, setPanel] = useState("channels");
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [activities, setActivities] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [fileSearch, setFileSearch] = useState("");
  const [messages, setMessages] = useState([]);

  const { token, logout, user } = useAuth();

  const fetchChannels = async () => {
    try {
      if (!selectedWorkspace) return;

      const response = await api.get(`/channels/${selectedWorkspace._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChannels(response.data);

      if (response.data.length > 0 && !selectedChannel) {
        setSelectedChannel(response.data[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTasks = async () => {
    try {
      if (!selectedWorkspace) return;
      const response = await api.get(`/tasks/${selectedWorkspace._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchActivities = async () => {
    try {
      if (!selectedWorkspace) return;
      const response = await api.get(`/activities/${selectedWorkspace._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setActivities(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMessagesForChannel = async () => {
    try {
      if (!selectedChannel) return;
      const response = await api.get(`/messages/${selectedChannel._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(response.data);
      setSharedFiles(
        response.data.filter((message) => message.fileUrl)
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchChannels();
  }, [selectedWorkspace, token]);

  useEffect(() => {
    if (!token || !selectedWorkspace) return;
    fetchTasks();
    fetchActivities();
  }, [selectedWorkspace, token]);

  useEffect(() => {
    if (!token || !selectedChannel) return;
    fetchMessagesForChannel();
  }, [selectedChannel, token]);

  useEffect(() => {
    socket.on("receive_message", (message) => {
      const channelId =
        typeof message.channel === "object"
          ? message.channel._id
          : message.channel;

      if (channelId !== selectedChannel?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [channelId]: (prev[channelId] || 0) + 1,
        }));
      } else {
        setMessages((prev) => [...prev, message]);
        if (message.fileUrl) {
          setSharedFiles((prev) => [...prev, message]);
        }
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedChannel]);

  const createChannel = async () => {
    if (!channelName.trim() || !selectedWorkspace) return;

    try {
      const response = await api.post(
        "/channels",
        {
          name: channelName,
          workspaceId: selectedWorkspace._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setChannels((prev) => [...prev, response.data]);
      setSelectedChannel(response.data);
      setChannelName("");
      setShowModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  const createTask = async () => {
    if (!taskTitle.trim() || !selectedWorkspace) return;

    try {
      const response = await api.post(
        "/tasks",
        {
          workspaceId: selectedWorkspace._id,
          title: taskTitle,
          description: taskDescription,
          assignedTo: taskAssignedTo || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTasks((prev) => [response.data, ...prev]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignedTo("");
    } catch (error) {
      console.log(error);
    }
  };

  const changeTaskStatus = async (taskId, status) => {
    try {
      await api.put(
        `/tasks/${taskId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, status } : task
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error) {
      console.log(error);
    }
  };

  const filteredFiles = sharedFiles.filter((message) => {
    const search = fileSearch.toLowerCase();
    return (
      message.content?.toLowerCase().includes(search) ||
      message.fileType?.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col h-screen overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">Workspace</h2>

        <div className="mb-3 flex gap-1 rounded-lg bg-zinc-950 p-1">
          {[
            { key: "channels", label: "Channels" },
            { key: "tasks", label: "Tasks" },
            { key: "activity", label: "Activity" },
            { key: "files", label: "Files" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPanel(tab.key)}
              className={`flex-1 rounded-md px-2 py-1 text-xs ${
                panel === tab.key ? "bg-blue-600" : "bg-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {panel === "channels" && (
          <div className="space-y-2">
            {channels.map((channel) => (
              <div
                key={channel._id}
                onClick={() => {
                  setSelectedChannel(channel);
                  setUnreadCounts((prev) => ({
                    ...prev,
                    [channel._id]: 0,
                  }));
                }}
                className={`cursor-pointer rounded-lg p-2 ${
                  selectedChannel?._id === channel._id
                    ? "bg-blue-600"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                <div className="flex justify-between">
                  <span># {channel.name}</span>
                  {unreadCounts[channel._id] > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-1 text-xs">
                      {unreadCounts[channel._id]}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 w-full rounded-lg bg-green-600 p-2 hover:bg-green-700"
            >
              + Add Channel
            </button>
          </div>
        )}

        {panel === "tasks" && (
          <div className="space-y-3">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg bg-zinc-800 p-2 text-sm"
            />
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Task description"
              className="w-full rounded-lg bg-zinc-800 p-2 text-sm"
            />
            <select
              value={taskAssignedTo}
              onChange={(e) => setTaskAssignedTo(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 p-2 text-sm"
            >
              <option value="">Unassigned</option>
              {selectedWorkspace?.members?.map((member) => {
                const userInfo = member.user;
                return (
                  <option key={userInfo?._id || member.user} value={userInfo?._id || member.user}>
                    {userInfo?.username || "Unknown"}
                  </option>
                );
              })}
            </select>
            <button
              onClick={createTask}
              className="w-full rounded-lg bg-blue-600 p-2 text-sm"
            >
              Add Task
            </button>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task._id} className="rounded-xl bg-zinc-800 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{task.title}</h4>
                    <button onClick={() => deleteTask(task._id)} className="text-xs text-red-400">Delete</button>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{task.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <select
                      value={task.status}
                      onChange={(e) => changeTaskStatus(task._id, e.target.value)}
                      className="rounded-md bg-zinc-900 p-1 text-xs"
                    >
                      <option>Todo</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                    <span className="text-xs text-zinc-300">
                      {task.assignedTo?.username || "Unassigned"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "activity" && (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity._id} className="rounded-xl bg-zinc-800 p-2 text-sm">
                <p>
                  <span className="font-semibold">{activity.user?.username || "User"}</span>{" "}
                  {activity.action}
                </p>
                {activity.details && (
                  <p className="mt-1 text-xs text-zinc-400">{activity.details}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {panel === "files" && (
          <div className="space-y-2">
            <input
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Search files"
              className="w-full rounded-lg bg-zinc-800 p-2 text-sm"
            />
            {filteredFiles.map((message) => (
              <a
                key={message._id}
                href={message.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl bg-zinc-800 p-3 text-sm"
              >
                <p className="font-medium">{message.content || message.fileType}</p>
                <p className="mt-1 text-xs text-zinc-400">{message.fileType}</p>
              </a>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-zinc-700 pt-4">
          <p className="text-sm text-zinc-400">{user?.username}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-lg bg-red-600 p-2 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="w-96 rounded-2xl bg-zinc-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">Create Channel</h2>
            <input
              type="text"
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="mb-4 w-full rounded-lg bg-zinc-800 p-3"
            />
            <button
              onClick={createChannel}
              className="w-full rounded-lg bg-blue-600 p-3 hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;