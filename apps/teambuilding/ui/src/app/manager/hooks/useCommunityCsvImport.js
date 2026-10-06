import { useState } from "react";
import { getUser, createUser, addUserToCommunity } from "../api/managerApi";
import { parseCsvFile, pickFile } from "../utils/files";

// CSV import of usernames into a community (creates missing users).
export default function useCommunityCsvImport({
  communityId,
  members,
  setUsers,
  setCommunityUsers,
}) {
  const [importing, setImporting] = useState(false);

  const importCommunityUsers = async (file) => {
    try {
      const usernames = await parseCsvFile(file);

      if (usernames.length === 0) {
        console.log("No usernames found in CSV file for community import");
        setImporting(false);
        return;
      }

      // Create users that don't exist and add all to community
      const results = {
        created: [],
        added: [],
        alreadyInCommunity: [],
        errors: [],
      };

      for (const username of usernames) {
        try {
          const trimmedUsername = username.trim();
          if (!trimmedUsername) continue;

          // Check if user already exists
          const userRes = await getUser(trimmedUsername);
          let user;

          if (userRes.ok) {
            user = await userRes.json();
          } else {
            // Create user if they don't exist
            const createRes = await createUser(trimmedUsername, "USER");

            if (createRes.ok) {
              const createData = await createRes.json();
              user = createData.user;
              results.created.push(trimmedUsername);
              // Update users list
              setUsers((prev) => [...prev, user]);
            } else {
              results.errors.push(`Failed to create user: ${trimmedUsername}`);
              continue;
            }
          }

          // Check if user is already in the community
          const currentCommunityUsers = members || [];
          const isAlreadyInCommunity = currentCommunityUsers.some((cu) => cu.id === user.id);

          if (isAlreadyInCommunity) {
            results.alreadyInCommunity.push(trimmedUsername);
          } else {
            // Add user to community
            const addRes = await addUserToCommunity(communityId, user.id);

            if (addRes.ok) {
              results.added.push(trimmedUsername);
              // Update community users state immediately
              setCommunityUsers((prev) => ({
                ...prev,
                [communityId]: [...(prev[communityId] || []), user],
              }));
            } else {
              results.errors.push(`Failed to add ${trimmedUsername} to community`);
            }
          }
        } catch (userError) {
          results.errors.push(`Error processing "${username}": ${userError.message}`);
        }
      }

      console.log("Community CSV Import completed!", {
        created: results.created.length,
        added: results.added.length,
        alreadyInCommunity: results.alreadyInCommunity.length,
        errors: results.errors.length,
      });

      if (results.errors.length > 0) {
        console.log("Community import errors:", results.errors);
      }

      setImporting(false);
    } catch (error) {
      console.log("Error reading CSV file for community import:", error.message);
      setImporting(false);
    }
  };

  // Import starts immediately once a file is selected
  const openFilePicker = () =>
    pickFile(".csv,.txt", (file) => {
      setImporting(true);
      importCommunityUsers(file);
    });

  return { importing, openFilePicker };
}
