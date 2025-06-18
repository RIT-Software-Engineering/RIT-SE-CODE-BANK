import { Component } from "react";

class Manager {
  constructor() {
    this.metaData = null;
    this.classes = [];
    this.teamCreationAlgo = null;
    this.users = []; // All created users
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

class Manager_page extends Component {
  constructor(props) {
    super(props);
    const managerInstance = new Manager();
    this.state = {
      manager: managerInstance,
      classSettings: {},
      newUser: "",
      selectedUsers: {} // { [classIndex]: selectedUsername }
    };
  }

  createClass = () => {
    const newClass = new Class(`Class ${this.state.manager.classes.length}`);
    const updatedManager = { ...this.state.manager };
    updatedManager.classes = [...updatedManager.classes, newClass];
    this.setState({
      manager: updatedManager,
      classSettings: {
        ...this.state.classSettings,
        [updatedManager.classes.length - 1]: { algorithm: "", size: "" }
      },
    });
  };

  handleAlgorithmChange = (e, classIndex) => {
    const newSettings = { ...this.state.classSettings };
    newSettings[classIndex] = {
      ...newSettings[classIndex],
      algorithm: e.target.value
    };
    this.setState({ classSettings: newSettings });
  };

  handleSizeChange = (e, classIndex) => {
    const newSettings = { ...this.state.classSettings };
    newSettings[classIndex] = {
      ...newSettings[classIndex],
      size: e.target.value
    };
    this.setState({ classSettings: newSettings });
  };

  handleSubmit = (classIndex) => {
    const settings = this.state.classSettings[classIndex];
    const size = parseInt(settings?.size);

    if (!settings || !settings.algorithm || !size || size <= 0) return;

    const updatedManager = { ...this.state.manager };
    updatedManager.classes = [...updatedManager.classes];
    updatedManager.classes[classIndex].createTeam(size);

    this.setState({ manager: updatedManager });
  };

  handleNewUserChange = (e) => {
    this.setState({ newUser: e.target.value });
  };

  createUser = () => {
    const { newUser, manager } = this.state;
    if (!newUser.trim()) return;

    const updatedManager = { ...manager };
    if (!updatedManager.users.includes(newUser)) {
      updatedManager.users = [...updatedManager.users, newUser];
    }

    this.setState({ manager: updatedManager, newUser: "" });
  };

  handleUserSelectChange = (e, classIndex) => {
    const newSelectedUsers = { ...this.state.selectedUsers };
    newSelectedUsers[classIndex] = e.target.value;
    this.setState({ selectedUsers: newSelectedUsers });
  };

  assignUserToClass = (classIndex) => {
    const { selectedUsers, manager } = this.state;
    const username = selectedUsers[classIndex];
    if (!username) return;

    const updatedManager = { ...manager };
    updatedManager.classes[classIndex].addUser(username);
    this.setState({ manager: updatedManager });
  };

  render() {
    const { manager, classSettings, newUser, selectedUsers } = this.state;

    return (
      <div>
        <h1>Manager Page</h1>

        {/* User creation */}
        <div>
          <h2>Create User</h2>
          <input
            type="text"
            placeholder="Enter username"
            value={newUser}
            onChange={this.handleNewUserChange}
          />
          <button onClick={this.createUser}>Create User</button>
        </div>

        <div className="show classes">
          <h2>Communities</h2>
          {manager.classes.length > 0 ? (
            manager.classes.map((cls, index) => {
              const settings = classSettings[index] || { algorithm: "", size: "" };
              const selectedUser = selectedUsers[index] || "";

              return (
                <div key={index} style={{ border: "1px solid black", padding: 10, margin: 10 }}>
                  <p><strong>{cls.name}</strong></p>

                  {/* Display teams */}
                  {cls.teams.length > 0 ? (
                    <p>{cls.teams.length} team(s) created</p>
                  ) : (
                    <div>
                      <select
                        value={settings.algorithm}
                        onChange={(e) => this.handleAlgorithmChange(e, index)}
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
                        onChange={(e) => this.handleSizeChange(e, index)}
                      />
                      <button onClick={() => this.handleSubmit(index)}>Create Team</button>
                    </div>
                  )}

                  {/* Display users in class */}
                  <div>
                    <p>Users in this Community: {cls.users.join(", ") || "None"}</p>

                    <select
                      value={selectedUser}
                      onChange={(e) => this.handleUserSelectChange(e, index)}
                    >
                      <option value="">Select user to add</option>
                      {manager.users.map((user, i) => (
                        <option key={i} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => this.assignUserToClass(index)}>
                      Add User to Community
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <a>No Communinities</a>
          )}
        </div>

        <button onClick={this.createClass}>Create Community</button>
      </div>
    );
  }
}

export default Manager_page;
