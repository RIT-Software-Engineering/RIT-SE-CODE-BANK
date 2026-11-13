"use client";
import { useState } from "react";
import { addUserToCommunity } from "./api/managerApi";
import "./styles/CommunityMembers.css";

// "Users in this Community" list + add-user control.
export default function CommunityMembers({
  communityId,
  allUsers,
  members,
  formatUser,
  setCommunityUsers,
  loadCommunityUsers,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");

  const handleAddUser = async () => {
    const userId = selectedUserId;
    if (!userId) return;
    const userObj = allUsers.find((u) => String(u.id) === String(userId));
    try {
      const res = await addUserToCommunity(communityId, userId);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to add user to community:", data.error);
      } else {
        setSelectedUserId("");
        console.log("User added to community successfully");
        // Optimistically update UI
        if (userObj) {
          setCommunityUsers((prev) => ({
            ...prev,
            [communityId]: [...(prev[communityId] || []), userObj],
          }));
        }
        // Fetch latest from backend for consistency
        loadCommunityUsers(communityId);
      }
    } catch {
      console.log("Server error adding user to community");
    }
  };

  return (
    <section className="community-members">
      <h3 className="community-members-title">Users in this Community</h3>
      <ul className="community-members-list">
        {members.map((user) => (
          <li className="community-members-item" key={user.id}>{formatUser(user)}</li>
        ))}
      </ul>
      <div className="community-members-add">
        <label className="community-members-label" htmlFor={`community-user-select-${communityId}`}>Add user to this community:</label>
        <div className="community-members-controls">
        <select className="community-members-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Select user to add</option>
          {allUsers
            .filter((u) => u.role === "USER" && !members.some((cu) => cu.id === u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {formatUser(u)}
              </option>
            ))}
        </select>
        <button className="community-members-button" onClick={handleAddUser} disabled={!selectedUserId}>
          Add User to Community
        </button>
      </div>
      </div>
    </section>
  );
}