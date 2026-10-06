import { useState } from "react";
import { addUserToTeam, removeUserFromTeam } from "../api/managerApi";

// Drag-and-drop of users between teams.
export default function useTeamDragAndDrop({ setTeamMembers }) {
  const [draggedUser, setDraggedUser] = useState(null); // { user, fromTeamId }

  const handleDragStart = (e, user, fromTeamId) => {
    setDraggedUser({ user, fromTeamId });
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("manager-team-member-dragging");
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("manager-team-member-dragging");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, teamId) => {
    e.preventDefault();
    if (draggedUser && draggedUser.fromTeamId !== teamId) {
      e.currentTarget.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e, teamId) => {
    e.preventDefault();
    if (draggedUser && draggedUser.fromTeamId !== teamId) {
      e.currentTarget.classList.remove("drag-over");
    }
  };

  const handleDrop = async (e, toTeamId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (!draggedUser || draggedUser.fromTeamId === toTeamId) {
      setDraggedUser(null);
      return;
    }

    const { user, fromTeamId } = draggedUser;

    try {
      // Remove user from current team
      const removeRes = await removeUserFromTeam(fromTeamId, user.id);

      if (!removeRes.ok) {
        const removeData = await removeRes.json();
        console.log("Failed to remove user from team:", removeData.error);
        setDraggedUser(null);
        return;
      }

      // Add user to new team
      const addRes = await addUserToTeam(toTeamId, user.id);

      if (!addRes.ok) {
        const addData = await addRes.json();
        console.log("Failed to add user to new team:", addData.error);
        // If adding fails, try to add back to original team
        await addUserToTeam(fromTeamId, user.id);
        setDraggedUser(null);
        return;
      }

      console.log(`Moved ${user.username} to new team successfully`);

      // Update local state immediately without page refresh
      setTeamMembers((prev) => ({
        ...prev,
        [fromTeamId]: (prev[fromTeamId] || []).filter((u) => u.id !== user.id),
        [toTeamId]: [...(prev[toTeamId] || []), user],
      }));
    } catch (error) {
      console.log("Error during team transfer:", error);
    }

    setDraggedUser(null);
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
