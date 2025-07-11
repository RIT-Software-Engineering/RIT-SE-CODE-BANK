"use client";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";
import { getCandidateApplications } from "../../services/db-apis";
import LoggedInEmployeePage from "./loggedInEmployeePage";

export default function Applications() {
  const { currentUser } = useAuth();
  // List of current applications gotton from backend
  const [activeApplications, setActiveApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We only want to fetch if we have a current user who is also an employer
    if (currentUser?.uid && currentUser.role === "EMPLOYER") {
      async function fetchApplications() {
        try {
          setLoading(true); // Set loading to true before fetch
          const data = await getCandidateApplications(currentUser.uid);

          console.log("Fetched data:", data);

          setActiveApplications(data);
          setError(null); // Clear any previous errors
        } catch (err) {
          console.error("Error fetching applications:", err);
          setError(err.message);
        } finally {
          setLoading(false); // Set loading to false after fetch completes
        }
      }
      fetchApplications();
    } else {
      // If there's no user or the user is not an employer, don't attempt to load.
      setLoading(false);
    }
  }, [currentUser]); // Re-run the effect if the currentUser changes

  // Content to load once a employer is logged in

  // Main body of application
  return (
    <>
      <div className="flex flex-col items-center p-4">
        <h1 className="text-4xl">Applications</h1>
        <p className="text-sm">See candidate applications</p>
      </div>
      <div className="flex flex-col items-center bg-gray-300 p-4 mb-10 ml-10 mr-10">
        {currentUser && currentUser.role === "EMPLOYER" ? (
          <div className="w-full flex flex-col items-center justify-center">
            <LoggedInEmployeePage loading={loading} error={error} activeApplications={activeApplications}/>
          </div>
        ) : (
          <div>Please make sure you are logged in as an EMPLOYER.</div>
        )}
      </div>
    </>
  );
}
