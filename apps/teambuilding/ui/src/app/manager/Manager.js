'use client';
import { useState } from "react";
import "../manager/manager.css";
import { useTheme } from "@mui/material/styles";

import useManagerData from "./hooks/useManagerData";
import useTeamDragAndDrop from "./hooks/useTeamDragAndDrop";
import { formatUser } from "./utils/formatUser";

import CreateUserForm from "./components/CreateUserForm";
import CreateCommunityForm from "./components/CreateCommunityForm";
import DisplayFormatSelect from "./components/DisplayFormatSelect";
import CommunityList from "./components/CommunityList";

export default function ManagerPage() {
  const theme = useTheme();
  const [userDisplayFormat, setUserDisplayFormat] = useState("username"); // "username", "email", "firstName lastName", "lastName firstName"

  const {
    managerId,
    communities,
    setCommunities,
    users,
    setUsers,
    communityUsers,
    setCommunityUsers,
    teamMembers,
    setTeamMembers,
    loading,
    reloadCommunities,
    loadCommunityUsers,
  } = useManagerData();

  const dragHandlers = useTeamDragAndDrop({ setTeamMembers });

  if (loading) return <div>Loading...</div>;

  return (
    <div
      className="manager-root"
      style={{
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        margin: "0px",
        padding: "0px",
      }}
    >
      <h1>Manager Page</h1>
      <CreateUserForm onUserCreated={(user) => setUsers((prev) => [...prev, user])} />
      <CreateCommunityForm
        managerId={managerId}
        onCommunityCreated={(community) => setCommunities((prev) => [...prev, community])}
        reloadCommunities={reloadCommunities}
      />
      <div className="show classes">
        <h2>Communities</h2>
        <DisplayFormatSelect value={userDisplayFormat} onChange={setUserDisplayFormat} />
        <CommunityList
          communities={communities}
          allUsers={users}
          communityUsers={communityUsers}
          teamMembers={teamMembers}
          formatUser={(user) => formatUser(user, userDisplayFormat)}
          dragHandlers={dragHandlers}
          reloadCommunities={reloadCommunities}
          setCommunities={setCommunities}
          setUsers={setUsers}
          setCommunityUsers={setCommunityUsers}
          loadCommunityUsers={loadCommunityUsers}
        />
      </div>
    </div>
  );
}
