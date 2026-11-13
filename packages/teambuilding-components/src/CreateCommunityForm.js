import { useState } from "react";
import { createCommunity } from "./api/managerApi";
import useBulkCommunityImport from "./hooks/useBulkCommunityImport";
import './styles/CreateCommunityForm.css';

export default function CreateCommunityForm({
  managerId,
  onCommunityCreated,
  reloadCommunities,
}) {
  const [newCommunity, setNewCommunity] = useState("");
  const bulkImport = useBulkCommunityImport({ managerId, reloadCommunities });

  const handleCreateCommunity = async () => {
    console.log("Creating Community");
    if (!newCommunity.trim() || !managerId) {console.log(managerId);return;}
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
      <h2 className="create-community-title">Create Community</h2>
      <div className="create-community-controls">
        <input
          type="text"
          placeholder="Enter community name"
          value={newCommunity}
          onChange={(e) => setNewCommunity(e.target.value)}
          className="create-community-input"
        />
        <button onClick={handleCreateCommunity} className="create-community-button">Create Community</button>
        <button
          className="create-community-button create-community-import-button"
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
