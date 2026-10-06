import { useState } from "react";
import { createCommunity } from "../api/managerApi";
import useBulkCommunityImport from "../hooks/useBulkCommunityImport";

export default function CreateCommunityForm({
  managerId,
  onCommunityCreated,
  reloadCommunities,
}) {
  const [newCommunity, setNewCommunity] = useState("");
  const bulkImport = useBulkCommunityImport({ managerId, reloadCommunities });

  const handleCreateCommunity = async () => {
    if (!newCommunity.trim() || !managerId) return;
    try {
      const res = await createCommunity(newCommunity, managerId);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to create community:", data.error);
      } else {
        onCommunityCreated(data.community);
        setNewCommunity("");
      }
    } catch {
      console.log("Server error creating community");
    }
  };

  return (
    <div>
      <h2>Create Community</h2>
      <div className="button-box">
        <input
          type="text"
          placeholder="Enter community name"
          value={newCommunity}
          onChange={(e) => setNewCommunity(e.target.value)}
        />
        <button onClick={handleCreateCommunity}>Create Community</button>
        <button
          onClick={bulkImport.openFilePicker}
          disabled={bulkImport.importing}
          title="Import communities from JSON file with structure: {communityName: {teamName: [users]}}"
        >
          {bulkImport.importing ? "Importing..." : "Import Communities"}
        </button>
      </div>
    </div>
  );
}
