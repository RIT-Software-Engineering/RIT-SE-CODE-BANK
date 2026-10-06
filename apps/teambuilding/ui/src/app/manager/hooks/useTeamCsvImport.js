import { useState } from "react";
import { importTeamCsv } from "../api/managerApi";
import { parseCsvFile, pickFile } from "../utils/files";

// CSV import of usernames into a single team.
export default function useTeamCsvImport(teamId, reloadCommunities) {
  const [importing, setImporting] = useState(false);

  const importCsvUsers = async (file) => {
    try {
      const usernames = await parseCsvFile(file);

      if (usernames.length === 0) {
        console.log("No usernames found in CSV file");
        setImporting(false);
        return;
      }

      const res = await importTeamCsv(teamId, usernames);
      const data = await res.json();

      if (!res.ok) {
        console.log("Failed to import CSV users:", data.error);
      } else {
        const { results } = data;
        console.log("CSV Import completed!", {
          created: results.usersCreated,
          added: results.usersAdded,
          alreadyInTeam: results.usersAlreadyInTeam,
          errors: results.errors,
        });

        if (results.errors > 0) {
          console.log("Import errors:", results.details.errors);
        }

        reloadCommunities();
        setImporting(false);
      }
    } catch (error) {
      console.log("Error reading CSV file:", error.message);
      setImporting(false);
    }
  };

  // Import starts immediately once a file is selected
  const openFilePicker = () =>
    pickFile(".csv,.txt", (file) => {
      setImporting(true);
      importCsvUsers(file);
    });

  return { importing, openFilePicker };
}
