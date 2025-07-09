'use client';
import { useState, useEffect } from "react";
import "./manager.css";

export default function ManagerPage() {
  const [managerId, setManagerId] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [communityUsers, setCommunityUsers] = useState({}); // { [communityId]: [user, ...] }
  const [newUser, setNewUser] = useState("");
  const [newCommunity, setNewCommunity] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [teamInputs, setTeamInputs] = useState({});
  const [teamAlgoInputs, setTeamAlgoInputs] = useState({});
  const [addUserInputs, setAddUserInputs] = useState({}); // { [communityId]: userId }
  const [addTeamUserInputs, setAddTeamUserInputs] = useState({}); // { [teamId]: userId }
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState({}); // { [communityId]: [userId, ...] }
  const [teamMembers, setTeamMembers] = useState({}); // { [teamId]: [user, ...] }

  useEffect(() => {
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    if (!username) {
      setMessage("No manager logged in.");
      setLoading(false);
      return;
    }
    fetch(`http://localhost:3000/api/user-role?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(async data => {
        if (data.role !== "MANAGER") {
          setMessage("You must be a manager to access this page.");
          setLoading(false);
          return;
        }
        const userRes = await fetch(`http://localhost:3000/api/user?username=${encodeURIComponent(username)}`);
        const userData = await userRes.json();
        if (!userData || !userData.id) {
          setMessage("Manager user not found.");
          setLoading(false);
          return;
        }
        setManagerId(userData.id);
        fetch(`http://localhost:3000/api/communities?managerId=${userData.id}`)
          .then(res => res.json())
          .then(commData => {
            setCommunities(commData.communities || []);
            setLoading(false);
            // Fetch users for each community
            (commData.communities || []).forEach(c => {
              fetch(`http://localhost:3000/api/community/${c.id}/users`)
                .then(res => res.json())
                .then(data => setCommunityUsers(prev => ({ ...prev, [c.id]: data.users || [] })));
            });
          });
        fetch(`http://localhost:3000/api/users/user-role`)
          .then(res => res.json())
          .then(userList => setUsers(userList.users || []));
      });
  }, []);

  // Fetch team members when communities load or change
  useEffect(() => {
    if (!communities.length) return;
    communities.forEach(community => {
      (community.teams || []).forEach(team => {
        fetch(`http://localhost:3000/api/team/${team.id}/users`)
          .then(res => res.json())
          .then(data => setTeamMembers(prev => ({ ...prev, [team.id]: data.users || [] })));
      });
    });
  }, [communities]);

  const reloadCommunities = async () => {
    if (!managerId) return;
    setLoading(true);
    const res = await fetch(`http://localhost:3000/api/communities?managerId=${managerId}`);
    const data = await res.json();
    setCommunities(data.communities || []);
    setLoading(false);
    // Reload users for each community
    (data.communities || []).forEach(c => {
      fetch(`http://localhost:3000/api/community/${c.id}/users`)
        .then(res => res.json())
        .then(data => setCommunityUsers(prev => ({ ...prev, [c.id]: data.users || [] })));
    });
  };

  const createUser = async () => {
    if (!newUser.trim()) return;
    try {
      const res = await fetch("http://localhost:3000/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUser, role: "USER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to create user.");
      } else {
        setMessage(`User "${newUser}" created.`);
        setUsers([...users, data.user]);
        setNewUser("");
      }
    } catch {
      setMessage("Server error.");
    }
  };

  const createCommunity = async () => {
    if (!newCommunity.trim() || !managerId) return;
    try {
      const res = await fetch("http://localhost:3000/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCommunity, managerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to create community.");
      } else {
        setMessage(`Community "${newCommunity}" created.`);
        setCommunities([...communities, data.community]);
        setNewCommunity("");
      }
    } catch {
      setMessage("Server error.");
    }
  };

  const deleteCommunity = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/community/${communityId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to delete community.");
      } else {
        setMessage("Community deleted.");
        setCommunities(communities.filter(c => c.id !== communityId));
      }
    } catch {
      setMessage("Server error.");
    }
  };

  // Add user to community
  const addUserToCommunity = async (communityId) => {
    const userId = addUserInputs[communityId];
    if (!userId) return;
    const userObj = users.find(u => String(u.id) === String(userId));
    try {
      const res = await fetch(`http://localhost:3000/api/community/${communityId}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to add user to community.");
      } else {
        setMessage("User added to community.");
        setAddUserInputs(prev => ({ ...prev, [communityId]: "" }));
        // Optimistically update UI
        if (userObj) {
          setCommunityUsers(prev => ({
            ...prev,
            [communityId]: [...(prev[communityId] || []), userObj]
          }));
        }
        // Fetch latest from backend for consistency
        fetch(`http://localhost:3000/api/community/${communityId}/users`)
          .then(res => res.json())
          .then(data => setCommunityUsers(prev => ({ ...prev, [communityId]: data.users || [] })));
      }
    } catch {
      setMessage("Server error.");
    }
  };

  // Add user to team
  const addUserToTeam = async (teamId, communityId) => {
    const userId = addTeamUserInputs[teamId];
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:3000/api/team/${teamId}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to add user to team.");
      } else {
        setMessage("User added to team.");
        setAddTeamUserInputs(prev => ({ ...prev, [teamId]: "" }));
        reloadCommunities();
      }
    } catch {
      setMessage("Server error.");
    }
  };

  const handleTeamAlgoInputChange = (communityId, field, value) => {
    setTeamAlgoInputs(prev => ({
      ...prev,
      [communityId]: {
        ...prev[communityId],
        [field]: value
      }
    }));
  };

  // Create teams (manual: one at a time, random: split all users in community)
  const createTeams = async (communityId) => {
    const algo = teamAlgoInputs[communityId]?.algo || "manual";
    const teamSize = Number(teamAlgoInputs[communityId]?.teamSize);
    if (!teamSize || teamSize <= 0) {
      setMessage("Please provide a valid team size.");
      return;
    }
    if (algo === "manual") {
      setMessage("Use the manual team creation inputs below.");
      return;
    }

    const usersInCommunity = communityUsers[communityId] || [];
    if (usersInCommunity.length === 0) {
      setMessage("No users in this community to split.");
      return;
    }

    // Shuffle users randomly
    const shuffled = [...usersInCommunity].sort(() => Math.random() - 0.5);

    // Split into teams of given size
    const teams = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
      teams.push(shuffled.slice(i, i + teamSize));
    }

    try {
      for (let i = 0; i < teams.length; i++) {
        const teamName = `Team ${i + 1}`;
        // Create the team
        const res = await fetch("http://localhost:3000/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: teamName,
            communityId,
            maxSize: teamSize,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || `Failed to create ${teamName}.`);
          return;
        }
        const teamId = data.team.id;
        // Add users to the team
        for (const user of teams[i]) {
          await fetch(`http://localhost:3000/api/team/${teamId}/add-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
        }
      }
      setMessage("Random teams created.");
      reloadCommunities();
      setTeamAlgoInputs(prev => ({ ...prev, [communityId]: { algo: "manual", teamSize: "" } }));
    } catch {
      setMessage("Server error.");
    }
  };

  const createTeam = async (communityId) => {
    const input = teamInputs[communityId];
    const name = input?.name?.trim();
    const maxSize = Number(input?.maxSize);
    if (!name || !maxSize || maxSize <= 0) return;
    try {
      const res = await fetch("http://localhost:3000/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, communityId, maxSize }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to create team.");
      } else {
        setMessage(`Team "${name}" created.`);
        reloadCommunities();
        setTeamInputs(prev => ({ ...prev, [communityId]: {} }));
      }
    } catch {
      setMessage("Server error.");
    }
  };

  const handleTeamInputChange = (communityId, field, value) => {
    setTeamInputs(prev => ({
      ...prev,
      [communityId]: {
        ...prev[communityId],
        [field]: value
      }
    }));
  };

  const updateTeam = async (teamId, newName) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/api/team/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to update team.");
      } else {
        setMessage("Team updated.");
        reloadCommunities();
      }
    } catch {
      setMessage("Server error.");
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/team/${teamId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to delete team.");
      } else {
        setMessage("Team deleted.");
        reloadCommunities();
      }
    } catch {
      setMessage("Server error.");
    }
  };

  const handleUserCheckboxChange = (communityId, userId) => {
    setSelectedUsersToAdd(prev => {
      const prevSelected = prev[communityId] || [];
      if (prevSelected.includes(userId)) {
        return { ...prev, [communityId]: prevSelected.filter(id => id !== userId) };
      } else {
        return { ...prev, [communityId]: [...prevSelected, userId] };
      }
    });
  };

  const addUsersToCommunity = async (communityId) => {
    const userIds = selectedUsersToAdd[communityId] || [];
    if (userIds.length === 0) return;
    try {
      const res = await fetch(`http://localhost:3000/api/community/${communityId}/add-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to add users to community.");
      } else {
        setMessage("Users added to community.");
        setSelectedUsersToAdd(prev => ({ ...prev, [communityId]: [] }));
        reloadCommunities();
      }
    } catch {
      setMessage("Server error.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="manager-root">
      <h1>Manager Page</h1>
      <div>
        <h2>Create User</h2>
        <div className="button-box">
          <input
            type="text"
            placeholder="Enter username"
            value={newUser}
            onChange={e => setNewUser(e.target.value)}
          />
          <button onClick={createUser}>Create User</button>
        </div>
      </div>
      <div>
        <h2>Create Community</h2>
        <div className="button-box">
          <input
            type="text"
            placeholder="Enter community name"
            value={newCommunity}
            onChange={e => setNewCommunity(e.target.value)}
          />
          <button onClick={createCommunity}>Create Community</button>
        </div>
      </div>
      {message && <div className="manager-message">{message}</div>}
      <div className="show classes">
        <h2>Communities</h2>
        {communities.length > 0 ? (
          communities.map((community) => (
            <div key={community.id} className="manager-class-box">
              <p className="manager-class-header">
                <strong>{community.name}</strong>
                <button
                  className="manager-delete-community-btn"
                  onClick={() => deleteCommunity(community.id)}
                  title="Delete this community"
                >
                  Delete Community
                </button>
              </p>
              <div>
                <h3>Users in this Community</h3>
                <ul>
                  {(communityUsers[community.id] || []).map(user => (
                    <li key={user.id}>{user.username}</li>
                  ))}
                </ul>
                <div>
                  <div style={{ marginBottom: 8 }}>Add user to this community:</div>
                  <select
                    style={{ minWidth: 200 }}
                    value={addUserInputs[community.id] || ""}
                    onChange={e => setAddUserInputs(prev => ({ ...prev, [community.id]: e.target.value }))}
                  >
                    <option value="">Select user to add</option>
                    {users
                      .filter(u => u.role === "USER" && !(communityUsers[community.id] || []).some(cu => cu.id === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                  </select>
                  <button
                    style={{ marginTop: 8, display: "block" }}
                    onClick={() => addUserToCommunity(community.id)}
                    disabled={!addUserInputs[community.id]}
                  >
                    Add User to Community
                  </button>
                </div>
                <h3>Teams</h3>
                {community.teams && community.teams.length > 0 ? (
                  community.teams.map((team) => (
                    <div key={team.id} className="manager-team-box">
                      <strong>
                        {team.name} <span className="manager-team-size">(max {team.maxSize})</span>
                      </strong>
                      <button
                        className="manager-delete-team-btn"
                        onClick={() => deleteTeam(team.id)}
                        title="Delete this team"
                      >
                        Delete Team
                      </button>
                      <button
                        className="manager-update-team-btn"
                        onClick={() => {
                          const newName = prompt("Enter new team name:", team.name);
                          if (newName && newName !== team.name) updateTeam(team.id, newName);
                        }}
                        title="Rename this team"
                      >
                        Rename Team
                      </button>
                      <div>
                        <strong>Members:</strong>
                        <ul style={{ margin: "4px 0 0 0", paddingLeft: 18 }}>
                          {(teamMembers[team.id] || []).length > 0 ? (
                            teamMembers[team.id].map(user => (
                              <li key={user.id}>{user.username}</li>
                            ))
                          ) : (
                            <li style={{ color: "#888" }}>No members</li>
                          )}
                        </ul>
                      </div>
                      <div className="button-box">
                        <select
                          value={addTeamUserInputs[team.id] || ""}
                          onChange={e => setAddTeamUserInputs(prev => ({ ...prev, [team.id]: e.target.value }))}
                        >
                          <option value="">Select user to add</option>
                          {(communityUsers[community.id] || [])
                            .filter(u =>
                              !(team.users || []).some(tm => tm.id === u.id)
                            )
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                        <button onClick={() => addUserToTeam(team.id, community.id)}>
                          Add User to Team
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>No teams</div>
                )}
                <div className="button-box">
                  <select
                    value={teamAlgoInputs[community.id]?.algo || "manual"}
                    onChange={e => handleTeamAlgoInputChange(community.id, "algo", e.target.value)}
                  >
                    <option value="manual">Manual</option>
                    <option value="random">Random</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Team size"
                    value={teamAlgoInputs[community.id]?.teamSize || ""}
                    onChange={e => handleTeamAlgoInputChange(community.id, "teamSize", e.target.value)}
                  />
                  <button onClick={() => createTeams(community.id)}>
                    Create Teams
                  </button>
                </div>
                {teamAlgoInputs[community.id]?.algo === "manual" && (
                  <div className="button-box">
                    <input
                      type="text"
                      placeholder="Team name"
                      value={teamInputs[community.id]?.name || ""}
                      onChange={e => handleTeamInputChange(community.id, "name", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max size"
                      value={teamInputs[community.id]?.maxSize || ""}
                      onChange={e => handleTeamInputChange(community.id, "maxSize", e.target.value)}
                    />
                    <button onClick={() => createTeam(community.id)}>
                      Create Team
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div>No communities found.</div>
        )}
      </div>
    </div>
  );
}
