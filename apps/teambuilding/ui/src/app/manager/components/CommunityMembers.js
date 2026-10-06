import { useState } from "react";
import { addUserToCommunity } from "../api/managerApi";

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
    <>
      <h3>Users in this Community</h3>
      <ul>
        {members.map((user) => (
          <li key={user.id}>{formatUser(user)}</li>
        ))}
      </ul>
      <div>
        <div>Add user to this community:</div>
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Select user to add</option>
          {allUsers
            .filter((u) => u.role === "USER" && !members.some((cu) => cu.id === u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {formatUser(u)}
              </option>
            ))}
        </select>
        <button onClick={handleAddUser} disabled={!selectedUserId}>
          Add User to Community
        </button>
      </div>
    </>
  );
}
