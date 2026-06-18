import { useState } from "react";

import WorkspaceSidebar from "../components/WorkspaceSidebar";

import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";

function MainLayout() {
  const [
    selectedWorkspace,
    setSelectedWorkspace,
  ] = useState(null);

  const [selectedChannel, setSelectedChannel] =
    useState(null);

  return (
    <div className="h-screen flex bg-black text-white">
      <WorkspaceSidebar
        selectedWorkspace={
          selectedWorkspace
        }
        setSelectedWorkspace={
          setSelectedWorkspace
        }
      />

      <Sidebar
        selectedWorkspace={
          selectedWorkspace
        }
        selectedChannel={selectedChannel}
        setSelectedChannel={
          setSelectedChannel
        }
      />

      <ChatArea
        selectedChannel={selectedChannel}
      />
    </div>
  );
}

export default MainLayout;