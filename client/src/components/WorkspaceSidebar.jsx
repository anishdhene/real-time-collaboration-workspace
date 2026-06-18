import ProfileModal from "./ProfileModal";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";

function WorkspaceSidebar({
  selectedWorkspace,
  setSelectedWorkspace,
}) {
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [notifications, setNotifications] = useState([]);

  const { token, user } = useAuth();

  const currentRole =
    selectedWorkspace?.members?.find(
      (member) =>
        (member.user?._id || member.user) === user?.id ||
        (member.user?._id || member.user) === user?._id
    )?.role || "member";

  const canManageWorkspace = ["owner", "admin"].includes(currentRole);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get("/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWorkspaces(response.data);

      if (response.data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(response.data[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchWorkspaces();
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("new_notification");
    };
  }, [token]);

  const createWorkspace = async (e) => {
    if (e) e.preventDefault();

    const formData = e?.currentTarget
      ? new FormData(e.currentTarget)
      : null;
    const name = (
      (formData?.get("workspaceName") || workspaceName || "")
        .toString()
        .trim()
    );

    if (!name || !token) return;

    try {
      const response = await api.post(
        "/workspaces",
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWorkspaces((prev) => [...prev, response.data]);
      setSelectedWorkspace(response.data);
      setWorkspaceName("");
      setShowModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  const inviteMember = async () => {
    try {
      await api.post(
        "/members/invite",
        {
          workspaceId: selectedWorkspace?._id,
          email: inviteEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Member Added ✅");
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (error) {
      console.log(error);
      alert("Invite Failed ❌");
    }
  };

  const promoteMember = async (memberId) => {
    try {
      await api.put(
        `/members/${selectedWorkspace._id}/promote`,
        { userId: memberId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedWorkspaces = await api.get("/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWorkspaces(updatedWorkspaces.data);
      setSelectedWorkspace(
        updatedWorkspaces.data.find(
          (workspace) => workspace._id === selectedWorkspace._id
        )
      );
    } catch (error) {
      console.log(error);
      alert("Could not promote member");
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.put(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="w-20 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 gap-4">
        {workspaces.map((workspace) => (
          <button
            key={workspace._id}
            onClick={() => setSelectedWorkspace(workspace)}
            className={`w-14 h-14 rounded-2xl font-bold ${
              selectedWorkspace?._id === workspace._id
                ? "bg-blue-600"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {workspace.name.charAt(0)}
          </button>
        ))}

        {selectedWorkspace?.members && (
          <div className="mt-6 w-full px-2 text-center">
            <h3 className="mb-3 text-[10px] font-bold text-zinc-400">MEMBERS</h3>
            <div className="space-y-2">
              {selectedWorkspace.members.map((member) => {
                const memberUser = member.user;
                const memberId = memberUser?._id || memberUser;

                return (
                  <div key={memberId} className="text-xs text-zinc-300">
                    <div className="flex items-center justify-between rounded-lg bg-zinc-900 px-2 py-1">
                      <span>{memberUser?.username || "Unknown"}</span>
                      <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase">
                        {member.role}
                      </span>
                    </div>
                    {currentRole === "owner" &&
                      member.role === "member" &&
                      memberId !== user?.id && (
                        <button
                          onClick={() => promoteMember(memberId)}
                          className="mt-1 text-[10px] text-emerald-400"
                        >
                          Promote
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowNotifications(true)}
          className="relative w-14 rounded-2xl bg-indigo-600 p-2 hover:bg-indigo-700 text-xs"
        >
          🔔
          {notifications.some((notification) => !notification.isRead) && (
            <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1.5 text-[10px]">
              {notifications.filter((n) => !n.isRead).length}
            </span>
          )}
        </button>

        {canManageWorkspace && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-14 rounded-2xl bg-purple-600 p-2 hover:bg-purple-700 text-xs"
          >
            Invite
          </button>
        )}

        <button
          onClick={() => setShowProfile(true)}
          className="w-14 rounded-2xl bg-yellow-600 p-2 hover:bg-yellow-700 text-xs"
        >
          Profile
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="w-14 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-3xl"
        >
          +
        </button>
      </div>

      {showNotifications && (
        <div className="fixed right-4 top-4 z-50 w-96 rounded-2xl bg-zinc-900 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={() => setShowNotifications(false)} className="text-sm text-zinc-400">
              Close
            </button>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-sm text-zinc-400">No notifications yet</p>
            )}
            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => markNotificationRead(notification._id)}
                className={`w-full rounded-xl p-3 text-left ${
                  notification.isRead ? "bg-zinc-800" : "bg-blue-600/20"
                }`}
              >
                <p className="text-sm">{notification.message || "New activity"}</p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {notification.workspace?.name || "Workspace"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <form
            onSubmit={createWorkspace}
            className="bg-zinc-900 p-6 rounded-2xl w-96"
          >
            <h2 className="text-2xl font-bold mb-4">Create Workspace</h2>
            <input
              type="text"
              name="workspaceName"
              placeholder="Workspace name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-800 mb-4"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg"
            >
              Create
            </button>
          </form>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="w-96 rounded-2xl bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-bold">Invite Member</h2>
            <input
              type="email"
              placeholder="Enter email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mb-4 w-full rounded-lg bg-zinc-800 p-3"
            />
            <button
              onClick={inviteMember}
              className="w-full rounded-lg bg-blue-600 p-3 hover:bg-blue-700"
            >
              Invite
            </button>
          </div>
        </div>
      )}

      <ProfileModal
        showProfile={showProfile}
        setShowProfile={setShowProfile}
      />
    </>
  );
}

export default WorkspaceSidebar;