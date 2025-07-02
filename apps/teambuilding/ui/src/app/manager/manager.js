'use client';
import { useState } from "react";
import "./manager.css"; // Import the CSS file

// Classes
class Manager {
  constructor() {
    this.metaData = null;
    this.classes = [];
    this.teamCreationAlgo = null;
    this.users = [];
  }
}

class Team {
  constructor(maxSize) {
    this.users = [];
    this.maxSize = maxSize;
    this.metaData = null;
  }
  addUser(user) {
    this.users.push(user);
  }
  removeUser(user) {
    this.users = this.users.filter((u) => u !== user);
  }
}

class Class {
  constructor(className) {
    this.name = className;
    this.teams = [];
    this.users = [];
  }
  createTeam(size) {
    const team = new Team(size);
    this.teams.push(team);
  }
  addUser(user) {
    if (!this.users.includes(user)) {
      this.users.push(user);
    }
  }
}

export default function ManagerPage() {
  // Remove localStorage loading, just use a fresh Manager each time
  const [manager, setManager] = useState(new Manager());

  const [classSettings, setClassSettings] = useState({});
  const [newUser, setNewUser] = useState("");
  const [selectedUsers, setSelectedUsers] = useState({}); // { [classIndex]: [user1, user2, ...] }

  const createClass = () => {
    const newClass = new Class(`Class ${manager.classes.length}`);
    const updatedManager = { ...manager, classes: [...manager.classes, newClass] };
    setManager(updatedManager);
    setClassSettings({
      ...classSettings,
      [updatedManager.classes.length - 1]: { algorithm: "", size: "" }
    });
  };

  const handleAlgorithmChange = (e, classIndex) => {
    setClassSettings({
      ...classSettings,
      [classIndex]: {
        ...classSettings[classIndex],
        algorithm: e.target.value
      }
    });
  };

  const handleSizeChange = (e, classIndex) => {
    setClassSettings({
      ...classSettings,
      [classIndex]: {
        ...classSettings[classIndex],
        size: e.target.value
      }
    });
  };

  const handleSubmit = (classIndex) => {
    const settings = classSettings[classIndex];
    const size = parseInt(settings?.size);
    if (!settings || !settings.algorithm || !size || size <= 0) return;

    // Deep copy manager and classes
    const updatedManager = { ...manager, classes: [...manager.classes] };
    updatedManager.classes[classIndex] = Object.assign(
      Object.create(Object.getPrototypeOf(manager.classes[classIndex])),
      manager.classes[classIndex]
    );

    // RANDOM TEAM ASSIGNMENT
    if (settings.algorithm === "random") {
      // Clear existing teams
      updatedManager.classes[classIndex].teams = [];
      const users = [...updatedManager.classes[classIndex].users];
      // Shuffle users
      for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]];
      }
      // Create teams and assign users
      for (let i = 0; i < users.length; i += size) {
        const team = new Team(size);
        team.users = users.slice(i, i + size);
        updatedManager.classes[classIndex].teams.push(team);
      }
    } else {
      // Default: just create an empty team of the specified size
      updatedManager.classes[classIndex].createTeam(size);
    }

    setManager(updatedManager);
  };

  const handleNewUserChange = (e) => setNewUser(e.target.value);

  const createUser = () => {
    if (!newUser.trim()) return;
    if (!manager.users.includes(newUser)) {
      setManager({ ...manager, users: [...manager.users, newUser] });
    }
    setNewUser("");
  };

  // Update handler for multi-select
  const handleUserSelectChange = (e, classIndex) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedUsers({ ...selectedUsers, [classIndex]: options });
  };

  // Assign all selected users to the class
  const assignUsersToClass = (classIndex) => {
    const usernames = selectedUsers[classIndex] || [];
    if (!usernames.length) return;
    const updatedManager = { ...manager, classes: [...manager.classes] };
    updatedManager.classes[classIndex] = Object.assign(
      Object.create(Object.getPrototypeOf(manager.classes[classIndex])),
      manager.classes[classIndex]
    );
    usernames.forEach(username => {
      updatedManager.classes[classIndex].addUser(username);
    });
    setManager(updatedManager);
  };

  // Replace the createTestUsers function with real names
  const createTestUsers = () => {
    const realNames = [
      "alice", "bob", "charlie", "dave", "eve", "frank", "grace", "heidi",
      "ivan", "judy", "mallory", "oscar", "peggy", "trent", "victor", "wendy",
      "jordan", "nina", "quinn", "riley"
    ];
    const uniqueUsers = realNames.filter(user => !manager.users.includes(user));
    if (uniqueUsers.length === 0) return;
    setManager({ ...manager, users: [...manager.users, ...uniqueUsers] });
  };

  // Remove a user from a team
  const removeUserFromTeam = (classIndex, teamIndex, user) => {
    const updatedManager = { ...manager, classes: [...manager.classes] };
    const cls = Object.assign(
      Object.create(Object.getPrototypeOf(manager.classes[classIndex])),
      manager.classes[classIndex]
    );
    const team = Object.assign(
      Object.create(Object.getPrototypeOf(cls.teams[teamIndex])),
      cls.teams[teamIndex]
    );
    team.users = team.users.filter(u => u !== user);
    cls.teams[teamIndex] = team;
    updatedManager.classes[classIndex] = cls;
    setManager(updatedManager);
  };

  // Add a user to a team (allow overfilling manually)
  const addUserToTeam = (classIndex, teamIndex, user) => {
    if (!user) return;
    const updatedManager = { ...manager, classes: [...manager.classes] };
    const cls = Object.assign(
      Object.create(Object.getPrototypeOf(manager.classes[classIndex])),
      manager.classes[classIndex]
    );
    const team = Object.assign(
      Object.create(Object.getPrototypeOf(cls.teams[teamIndex])),
      cls.teams[teamIndex]
    );
    if (!team.users.includes(user)) { // removed maxSize check to allow overfilling
      team.users.push(user);
      cls.teams[teamIndex] = team;
      updatedManager.classes[classIndex] = cls;
      setManager(updatedManager);
    }
  };

  // Add this function to delete a team from a class
  const deleteTeam = (classIndex, teamIndex) => {
    const updatedManager = { ...manager, classes: [...manager.classes] };
    const cls = Object.assign(
      Object.create(Object.getPrototypeOf(manager.classes[classIndex])),
      manager.classes[classIndex]
    );
    cls.teams = cls.teams.filter((_, idx) => idx !== teamIndex);
    updatedManager.classes[classIndex] = cls;
    setManager(updatedManager);
  };

  // Add this function to delete a class/community
  const deleteClass = (classIndex) => {
    const updatedManager = { ...manager, classes: [...manager.classes] };
    updatedManager.classes.splice(classIndex, 1);
    setManager(updatedManager);
  };

  return (
    <div className="manager-root">
      <h1>Manager Page</h1>
      {/* User creation */}
      <div>
        <h2>Create User</h2>
        <div className="button-box">
          <input
            type="text"
            placeholder="Enter username"
            value={newUser}
            onChange={handleNewUserChange}
          />
          <button onClick={createUser}>Create User</button>
        </div>
      </div>

      <div className="show classes">
        <h2>Communities</h2>
        {manager.classes.length > 0 ? (
          manager.classes.map((cls, index) => {
            const settings = classSettings[index] || { algorithm: "", size: "" };
            const selected = selectedUsers[index] || [];
            return (
              <div key={index} className="manager-class-box">
                <p className="manager-class-header">
                  <strong>{cls.name}</strong>
                  <button
                    className="manager-delete-community-btn"
                    onClick={() => deleteClass(index)}
                    title="Delete this community"
                  >
                    Delete Community
                  </button>
                </p>
                {/* Display teams */}
                {cls.teams.length > 0 ? (
                  <div>
                    <p>{cls.teams.length} team(s) created</p>
                    <div className="manager-teams-container">
                      {cls.teams.map((team, tIdx) => (
                        <div
                          key={tIdx}
                          className="manager-team-box"
                        >
                          <strong>
                            Team {tIdx + 1}{" "}
                            <span className="manager-team-size">
                              ({team.users.length} / {team.maxSize})
                            </span>
                          </strong>
                          <ul className="manager-team-users-list">
                            {team.users.length > 0 ? (
                              team.users.map((user, uIdx) => (
                                <li
                                  key={uIdx}
                                  className="manager-team-user"
                                  onClick={() => {
                                    localStorage.setItem("username", user);
                                    window.location.href = "/user";
                                  }}
                                  title={`Go to ${user}'s user page`}
                                >
                                  {user}
                                  <button
                                    className="manager-remove-user-btn"
                                    onClick={e => {
                                      e.stopPropagation();
                                      removeUserFromTeam(index, tIdx, user);
                                    }}
                                    title="Remove user from team"
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="manager-team-no-members">No members</li>
                            )}
                          </ul>
                          {/* Add user to team */}
                          <div className="manager-add-user-row">
                            <select
                              defaultValue=""
                              className="manager-add-user-select"
                              onChange={e => {
                                addUserToTeam(index, tIdx, e.target.value);
                                e.target.value = "";
                              }}
                            >
                              <option value="" disabled>
                                Add user...
                              </option>
                              {cls.users
                                .filter(
                                  user =>
                                    !team.users.includes(user)
                                )
                                .map((user, i) => (
                                  <option key={i} value={user}>
                                    {user}
                                  </option>
                                ))}
                            </select>
                            <button
                              className="manager-delete-team-btn"
                              onClick={() => deleteTeam(index, tIdx)}
                              title="Delete this team"
                            >
                              Delete Team
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="button-box">
                    <select
                      value={settings.algorithm}
                      onChange={(e) => handleAlgorithmChange(e, index)}
                    >
                      <option value="">Select algorithm</option>
                      <option value="manual">Manual</option>
                      <option value="random">Random</option>
                      <option value="student choice">Student Choice</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Team size"
                      value={settings.size}
                      onChange={(e) => handleSizeChange(e, index)}
                    />
                    <button onClick={() => handleSubmit(index)}>Create Team</button>
                  </div>
                )}
                {/* Display users in class */}
                <div className="button-box manager-users-in-community">
                  <p>Users in this Community: {cls.users.join(", ") || "None"}</p>
                  {/* Only show user add controls if no teams have been created */}
                  {cls.teams.length === 0 && (
                    <>
                      <select
                        multiple
                        value={selected}
                        onChange={e => handleUserSelectChange(e, index)}
                        className="manager-multiselect-users"
                      >
                        {manager.users.map((user, i) => (
                          <option key={i} value={user}>
                            {user}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => assignUsersToClass(index)}>
                        Add Selected Users to Community
                      </button>
                    </>
                  )}
                </div>
                {cls.teams.length > 0 && (
                  <div className="button-box manager-new-team-btn-row">
                    <button
                      className="manager-new-team-btn"
                      onClick={() => {
                        const teamSize = cls.teams.length > 0 ? cls.teams[0].maxSize : 4;
                        const updatedManager = { ...manager, classes: [...manager.classes] };
                        updatedManager.classes[index] = Object.assign(
                          Object.create(Object.getPrototypeOf(manager.classes[index])),
                          manager.classes[index]
                        );
                        updatedManager.classes[index].createTeam(teamSize);
                        setManager(updatedManager);
                      }}
                    >
                      + New Team
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <a>No Communities</a>
        )}
      </div>
      <div className="button-box" style={{ marginTop: "10px" }}>
        <button onClick={createClass}>Create Community</button>
      </div>

      {/* Floating button at bottom right */}
      <button
        className="test-users-fab"
        onClick={createTestUsers}
        title="Create 20 Test Users"
      >
        Create 20 Test Users
      </button>
    </div>
  );
}

// Add this CSS to manager.css:

/* filepath: c:\Users\fayja\OneDrive\Desktop\coding\RIT-SE-CODE-BANK\apps\teambuilding\ui\src\app\manager\manager.css */
