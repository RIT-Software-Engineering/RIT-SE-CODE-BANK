import { useState } from "react";
import { addUserToTeam, updateTeam, deleteTeam } from "../api/managerApi";
import useTeamCsvImport from "../hooks/useTeamCsvImport";

export default function TeamCard({
  team,
  communityMembers,
  members,
  formatUser,
  dragHandlers,
  reloadCommunities,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const csvImport = useTeamCsvImport(team.id, reloadCommunities);

  const handleAddUser = async () => {
    const userId = selectedUserId;
    if (!userId) return;
    try {
      const res = await addUserToTeam(team.id, userId);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to add user to team:", data.error);
      } else {
        setSelectedUserId("");
        reloadCommunities();
      }
    } catch {
      console.log("Server error adding user to team");
    }
  };

  const handleRename = async (newName) => {
    if (!newName.trim()) return;
    try {
      const res = await updateTeam(team.id, newName);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to update team:", data.error);
      } else {
        console.log("Team updated successfully");
        reloadCommunities();
      }
    } catch {
      console.log("Server error updating team");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteTeam(team.id);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to delete team:", data.error);
      } else {
        console.log("Team deleted successfully");
        reloadCommunities();
      }
    } catch {
      console.log("Server error deleting team");
    }
  };

  return (
    <div
      className="manager-team-box manager-team-box-drop-zone"
      onDragOver={dragHandlers.handleDragOver}
      onDragEnter={(e) => dragHandlers.handleDragEnter(e, team.id)}
      onDragLeave={(e) => dragHandlers.handleDragLeave(e, team.id)}
      onDrop={(e) => dragHandlers.handleDrop(e, team.id)}
    >
      <strong>
        {team.name} <span className="manager-team-size">(max {team.maxSize})</span>
      </strong>
      <button
        onClick={csvImport.openFilePicker}
        disabled={csvImport.importing}
        title="Import users from CSV file"
      >
        {csvImport.importing ? "Importing..." : "Import Users"}
      </button>
      <button
        className="manager-update-team-btn"
        onClick={() => {
          const newName = prompt("Enter new team name:", team.name);
          if (newName && newName !== team.name) handleRename(newName);
        }}
        title="Rename this team"
      >
        Rename Team
      </button>
      <button
        className="manager-delete-team-btn"
        onClick={handleDelete}
        title="Delete this team"
      >
        Delete Team
      </button>
      <div>
        <strong>Members:</strong>
        <ul>
          {members.length > 0 ? (
            members.map((user) => (
              <li
                key={user.id}
                className="manager-team-member-draggable"
                draggable
                onDragStart={(e) => dragHandlers.handleDragStart(e, user, team.id)}
                onDragEnd={dragHandlers.handleDragEnd}
                title="Drag to move to another team"
              >
                {formatUser(user)}
              </li>
            ))
          ) : (
            <li>No members</li>
          )}
        </ul>
      </div>
      <div className="button-box">
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Select user to add</option>
          {communityMembers
            .filter((u) => !(team.users || []).some((tm) => tm.id === u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {formatUser(u)}
              </option>
            ))}
        </select>
        <button onClick={handleAddUser}>Add User to Team</button>
      </div>
    </div>
  );
}
