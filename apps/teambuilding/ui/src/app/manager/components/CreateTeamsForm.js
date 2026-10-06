import { useState } from "react";
import { createTeam, addUserToTeam } from "../api/managerApi";

// Two forms: "Create Teams" (manual empty team / random split of all
// community users) and, in manual mode, "Create Team" with a custom name.
export default function CreateTeamsForm({ communityId, communityMembers, reloadCommunities }) {
  const [algoInputs, setAlgoInputs] = useState({}); // { algo, teamSize }
  const [teamInput, setTeamInput] = useState({}); // { name, maxSize }

  const algo = algoInputs.algo || "manual";

  const handleAlgoInputChange = (field, value) =>
    setAlgoInputs((prev) => ({ ...prev, [field]: value }));

  const handleTeamInputChange = (field, value) =>
    setTeamInput((prev) => ({ ...prev, [field]: value }));

  // Create teams (manual: one empty team, random: split all users in community)
  const handleCreateTeams = async () => {
    const teamSize = Number(algoInputs.teamSize);
    if (!teamSize || teamSize <= 0) {
      console.log("Invalid team size provided");
      return;
    }
    if (algo === "manual") {
      // Create an empty team of the specified size
      const teamName = `Team ${Math.floor(Math.random() * 10000)}`;
      try {
        const res = await createTeam(teamName, communityId, teamSize);
        const data = await res.json();
        if (!res.ok) {
          console.log("Failed to create team:", data.error);
        } else {
          reloadCommunities();
        }
      } catch {
        console.log("Server error creating empty team");
      }
      return;
    }

    if (communityMembers.length === 0) {
      console.log("No users in community to split into teams");
      return;
    }

    // Shuffle users randomly
    const shuffled = [...communityMembers].sort(() => Math.random() - 0.5);

    // Split into teams of given size
    const teams = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
      teams.push(shuffled.slice(i, i + teamSize));
    }

    try {
      for (let i = 0; i < teams.length; i++) {
        const teamName = `Team ${i + 1}`;
        // Create the team
        const res = await createTeam(teamName, communityId, teamSize);
        const data = await res.json();
        if (!res.ok) {
          console.log("Failed to create team:", teamName, data.error);
          return;
        }
        const teamId = data.team.id;
        // Add users to the team
        for (const user of teams[i]) {
          await addUserToTeam(teamId, user.id);
        }
      }
      console.log("Random teams created successfully");
      reloadCommunities();
      setAlgoInputs({ algo: "manual", teamSize: "" });
    } catch {
      console.log("Server error creating random teams");
    }
  };

  const handleCreateTeam = async () => {
    const name = teamInput.name?.trim();
    const maxSize = Number(teamInput.maxSize);
    if (!name || !maxSize || maxSize <= 0) return;
    try {
      const res = await createTeam(name, communityId, maxSize);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to create team:", data.error);
      } else {
        console.log("Team created successfully:", name);
        reloadCommunities();
        setTeamInput({});
      }
    } catch {
      console.log("Server error creating team");
    }
  };

  return (
    <>
      <div className="button-box">
        <select value={algo} onChange={(e) => handleAlgoInputChange("algo", e.target.value)}>
          <option value="manual">Manual</option>
          <option value="random">Random</option>
        </select>
        <input
          type="number"
          placeholder="Team size"
          value={algoInputs.teamSize || ""}
          onChange={(e) => handleAlgoInputChange("teamSize", e.target.value)}
        />
        <button onClick={handleCreateTeams}>Create Teams</button>
      </div>
      {algoInputs.algo === "manual" && (
        <div className="button-box">
          <input
            type="text"
            placeholder="Team name"
            value={teamInput.name || ""}
            onChange={(e) => handleTeamInputChange("name", e.target.value)}
          />
          <input
            type="number"
            placeholder="Max size"
            value={teamInput.maxSize || ""}
            onChange={(e) => handleTeamInputChange("maxSize", e.target.value)}
          />
          <button onClick={handleCreateTeam}>Create Team</button>
        </div>
      )}
    </>
  );
}
