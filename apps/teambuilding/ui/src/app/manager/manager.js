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
  const [loading, setLoading] = useState(true);
  const [teamInputs, setTeamInputs] = useState({});
  const [teamAlgoInputs, setTeamAlgoInputs] = useState({});
  const [addUserInputs, setAddUserInputs] = useState({}); // { [communityId]: userId }
  const [addTeamUserInputs, setAddTeamUserInputs] = useState({}); // { [teamId]: userId }
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState({}); // { [communityId]: [userId, ...] }
  const [teamMembers, setTeamMembers] = useState({}); // { [teamId]: [user, ...] }
  const [csvImportStates, setCsvImportStates] = useState({}); // { [teamId]: { file: File|null, importing: boolean } }
  const [draggedUser, setDraggedUser] = useState(null); // { user, fromTeamId }

  useEffect(() => {
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    if (!username) {
      setLoading(false);
      return;
    }
    fetch(`http://localhost:3000/api/user-role?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(async data => {
        if (data.role !== "MANAGER") {
          setLoading(false);
          return;
        }
        const userRes = await fetch(`http://localhost:3000/api/user?username=${encodeURIComponent(username)}`);
        const userData = await userRes.json();
        if (!userData || !userData.id) {
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
        console.log("Failed to create user:", data.error);
      } else {
        setUsers([...users, data.user]);
        setNewUser("");
      }
    } catch {
      console.log("Server error creating user");
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
        console.log("Failed to create community:", data.error);
      } else {
        setCommunities([...communities, data.community]);
        setNewCommunity("");
      }
    } catch {
      console.log("Server error creating community");
    }
  };

  const deleteCommunity = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/community/${communityId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to delete community:", data.error);
      } else {
        setCommunities(communities.filter(c => c.id !== communityId));
      }
    } catch {
      console.log("Server error deleting community");
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
        console.log("Failed to add user to community:", data.error);
      } else {
        setAddUserInputs(prev => ({ ...prev, [communityId]: "" }));
        console.log("User added to community successfully");
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
      console.log("Server error adding user to community");
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
        console.log("Failed to add user to team:", data.error);
      } else {
        setAddTeamUserInputs(prev => ({ ...prev, [teamId]: "" }));
        reloadCommunities();
      }
    } catch {
      console.log("Server error adding user to team");
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
      console.log("Invalid team size provided");
      return;
    }
    if (algo === "manual") {
      console.log("Manual team creation selected");
      return;
    }

    const usersInCommunity = communityUsers[communityId] || [];
    if (usersInCommunity.length === 0) {
      console.log("No users in community to split into teams");
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
          console.log("Failed to create team:", teamName, data.error);
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
      console.log("Random teams created successfully");
      reloadCommunities();
      setTeamAlgoInputs(prev => ({ ...prev, [communityId]: { algo: "manual", teamSize: "" } }));
    } catch {
      console.log("Server error creating random teams");
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
        console.log("Failed to create team:", data.error);
      } else {
        console.log("Team created successfully:", name);
        reloadCommunities();
        setTeamInputs(prev => ({ ...prev, [communityId]: {} }));
      }
    } catch {
      console.log("Server error creating team");
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
        console.log("Failed to update team:", data.error);
      } else {
        console.log("Team updated successfully");
        reloadCommunities();
      }
    } catch {
      console.log("Server error updating team");
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/team/${teamId}`, {
        method: "DELETE",
      });
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
        console.log("Failed to add users to community:", data.error);
      } else {
        console.log("Users added to community successfully");
        setSelectedUsersToAdd(prev => ({ ...prev, [communityId]: [] }));
        reloadCommunities();
      }
    } catch {
      console.log("Server error adding users to community");
    }
  };

  // CSV Import functionality
  const handleCsvFileChange = (teamId, file) => {
    if (!file) return;
    
    // Immediately start import process when file is selected
    setCsvImportStates(prev => ({
      ...prev,
      [teamId]: { file, importing: true }
    }));

    importCsvUsers(teamId, file);
  };

  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const usernames = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              // Handle both single column and CSV with commas
              const values = line.split(',').map(v => v.trim());
              usernames.push(...values.filter(v => v));
            }
          }
          
          resolve(usernames);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const importCsvUsers = async (teamId, file) => {
    try {
      const usernames = await parseCsvFile(file);
      
      if (usernames.length === 0) {
        console.log("No usernames found in CSV file");
        setCsvImportStates(prev => ({
          ...prev,
          [teamId]: { file: null, importing: false }
        }));
        return;
      }

      const res = await fetch(`http://localhost:3000/api/team/${teamId}/import-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.log("Failed to import CSV users:", data.error);
      } else {
        const { results } = data;
        console.log("CSV Import completed!", {
          created: results.usersCreated,
          added: results.usersAdded,
          alreadyInTeam: results.usersAlreadyInTeam,
          errors: results.errors
        });
        
        if (results.errors > 0) {
          console.log("Import errors:", results.details.errors);
        }
        
        reloadCommunities();
        
        // Clear the file input
        setCsvImportStates(prev => ({
          ...prev,
          [teamId]: { file: null, importing: false }
        }));
      }
    } catch (error) {
      console.log("Error reading CSV file:", error.message);
      setCsvImportStates(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], importing: false }
      }));
    }
  };

  const triggerFileInput = (teamId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.txt';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleCsvFileChange(teamId, file);
      }
    };
    fileInput.click();
  };

  // Drag and drop functionality
  const handleDragStart = (e, user, fromTeamId) => {
    setDraggedUser({ user, fromTeamId });
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('manager-team-member-dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('manager-team-member-dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, teamId) => {
    e.preventDefault();
    if (draggedUser && draggedUser.fromTeamId !== teamId) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e, teamId) => {
    e.preventDefault();
    if (draggedUser && draggedUser.fromTeamId !== teamId) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = async (e, toTeamId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedUser || draggedUser.fromTeamId === toTeamId) {
      setDraggedUser(null);
      return;
    }

    const { user, fromTeamId } = draggedUser;
    
    try {
      // Remove user from current team
      const removeRes = await fetch(`http://localhost:3000/api/team/${fromTeamId}/remove-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!removeRes.ok) {
        const removeData = await removeRes.json();
        console.log("Failed to remove user from team:", removeData.error);
        setDraggedUser(null);
        return;
      }

      // Add user to new team
      const addRes = await fetch(`http://localhost:3000/api/team/${toTeamId}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!addRes.ok) {
        const addData = await addRes.json();
        console.log("Failed to add user to new team:", addData.error);
        // If adding fails, try to add back to original team
        await fetch(`http://localhost:3000/api/team/${fromTeamId}/add-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        setDraggedUser(null);
        return;
      }

      console.log(`Moved ${user.username} to new team successfully`);
      
      // Update local state immediately without page refresh
      setTeamMembers(prev => ({
        ...prev,
        [fromTeamId]: (prev[fromTeamId] || []).filter(u => u.id !== user.id),
        [toTeamId]: [...(prev[toTeamId] || []), user]
      }));
      
    } catch (error) {
      console.log("Error during team transfer:", error);
    }
    
    setDraggedUser(null);
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
                    <div 
                      key={team.id} 
                      className="manager-team-box manager-team-box-drop-zone"
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, team.id)}
                      onDragLeave={(e) => handleDragLeave(e, team.id)}
                      onDrop={(e) => handleDrop(e, team.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <strong>
                          {team.name} <span className="manager-team-size">(max {team.maxSize})</span>
                        </strong>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => triggerFileInput(team.id)}
                            disabled={csvImportStates[team.id]?.importing}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              backgroundColor: csvImportStates[team.id]?.importing ? '#ccc' : '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: csvImportStates[team.id]?.importing ? 'not-allowed' : 'pointer'
                            }}
                            title="Import users from CSV file"
                          >
                            {csvImportStates[team.id]?.importing ? 'Importing...' : 'Import Users'}
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
                          <button
                            className="manager-delete-team-btn"
                            onClick={() => deleteTeam(team.id)}
                            title="Delete this team"
                          >
                            Delete Team
                          </button>
                        </div>
                      </div>
                      <div>
                        <strong>Members:</strong>
                        <ul style={{ margin: "4px 0 0 0", paddingLeft: 18 }}>
                          {(teamMembers[team.id] || []).length > 0 ? (
                            teamMembers[team.id].map(user => (
                              <li 
                                key={user.id}
                                className="manager-team-member-draggable"
                                draggable
                                onDragStart={(e) => handleDragStart(e, user, team.id)}
                                onDragEnd={handleDragEnd}
                                title="Drag to move to another team"
                              >
                                {user.username}
                              </li>
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
