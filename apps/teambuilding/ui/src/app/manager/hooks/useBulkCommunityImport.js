import { useState } from "react";
import { bulkCreateCommunities } from "../api/managerApi";
import { parseJsonFile, pickFile } from "../utils/files";

// Bulk community creation from a JSON file:
// { communityName: { teamName: [users] } }
export default function useBulkCommunityImport({ managerId, reloadCommunities }) {
  const [importing, setImporting] = useState(false);

  const importBulkCommunities = async (file) => {
    try {
      const jsonData = await parseJsonFile(file);

      if (!jsonData || typeof jsonData !== "object") {
        console.log("Invalid JSON structure");
        setImporting(false);
        return;
      }

      const res = await bulkCreateCommunities(managerId, jsonData);
      const responseData = await res.json();

      if (!res.ok) {
        console.log("Failed to import bulk communities:", responseData.error);
      } else {
        console.log("Bulk community import completed successfully!");
        // Reload communities to show the newly created ones
        reloadCommunities();
      }

      setImporting(false);
    } catch (error) {
      console.log("Error during bulk import:", error.message);
      setImporting(false);
    }
  };

  const openFilePicker = () =>
    pickFile(".json", (file) => {
      setImporting(true);
      importBulkCommunities(file);
    });

  return { importing, openFilePicker };
}
