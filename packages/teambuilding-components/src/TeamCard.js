"use client";
import { useState } from "react";
import { addUserToTeam, updateTeam, deleteTeam } from "./api/managerApi";
import useTeamCsvImport from "./hooks/useTeamCsvImport";
import './styles/TeamSection.css';

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
      className="manager-team-box manager-team-box-drop-zone team-card"
      onDragOver={dragHandlers.handleDragOver}
      onDragEnter={(e) => dragHandlers.handleDragEnter(e, team.id)}
      onDragLeave={(e) => dragHandlers.handleDragLeave(e, team.id)}
      onDrop={(e) => dragHandlers.handleDrop(e, team.id)}
    >
      <div className="team-card-header">
        <strong className="team-card-title">
          {team.name} <span className="manager-team-size">(max {team.maxSize})</span>
        </strong>
          <div className="team-card-actions">
          <button
            className="team-action-button team-import-button"
            onClick={csvImport.openFilePicker}
            disabled={csvImport.importing}
            title="Import users from CSV file"
          >
            {csvImport.importing ? "Importing..." : "Import Users"}
          </button>
          <button
            className="manager-update-team-btn team-action-button team-secondary-button"
            onClick={() => {
              const newName = prompt("Enter new team name:", team.name);
              if (newName && newName !== team.name) handleRename(newName);
            }}
            title="Rename this team"
          >
            Rename Team
          </button>
          <button
            className="manager-delete-team-btn team-action-button team-delete-button"
            onClick={handleDelete}
            title="Delete this team"
          >
            Delete Team
          </button>
        </div>
      </div>

      <div className="team-card-members">
        <strong className="team-card-section-title">Members:</strong>
        <ul className="team-card-member-list">
          {members.length > 0 ? (
            members.map((user) => (
              <li
                key={user.id}
                className="manager-team-member-draggable team-card-member"
                draggable
                onDragStart={(e) => dragHandlers.handleDragStart(e, user, team.id)}
                onDragEnd={dragHandlers.handleDragEnd}
                title="Drag to move to another team"
              >
                {formatUser(user)}
              </li>
            ))
          ) : (
            <li className="team-card-empty">No members</li>
          )}
        </ul>
      </div>
      <div className="button-box team-card-add-use">
        <select className="team-card-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Select user to add</option>
          {communityMembers
            .filter((u) => !(team.users || []).some((tm) => tm.id === u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {formatUser(u)}
              </option>
            ))}
        </select>
        <button className="team-action-button team-add-user-button" onClick={handleAddUser}>Add User to Team</button>
      </div>
    </div>
  );
}
