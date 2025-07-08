// src/app/Users/[userId]/Messaging/page.js
"use client";
import { useParams } from "next/navigation";

import { getUserProfile } from "@/services/api";
import { useEffect } from "react";
import { useState } from "react";

export default function Messaging() {
  const { userId } = useParams();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("User ID not found in URL.");
      return;
    }

    const fetchRecipientData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call the function to get the user's profile using the ID from the URL.
        const userProfile = await getUserProfile(userId);

        // Assuming the returned profile object has an 'email' property.
        if (userProfile && userProfile.email) {
          setRecipientEmail(userProfile.email);
        } else {
          // Handle cases where the profile is found but has no email.
          setError("Could not find an email for this user.");
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError(err.message || "An error occurred while fetching user data.");
      } finally {
        // This runs whether the fetch succeeded or failed.
        setLoading(false);
      }
    };
    fetchRecipientData()
  },[userId]);

      const renderHeadingContent = () => {
        if (loading) {
            return "Loading recipient information...";
        }
        if (error) {
            // Display a user-friendly error message.
            return `Error: Could not load user data.`;
        }
        // If we have an email, display it. Otherwise, fall back to the userId.
        return `Sending a message to ${recipientEmail || userId}:`;
    };
  return (
    <>
      <div className="h-auto bg-rit-gray p-20 w-2/3 m-auto mt-20">
        <div className="bg-rit-light-gray h-full flex flex-col p-10 rounded-lg">
          <div className="text-left mb-5">
            <h2>{renderHeadingContent()}</h2>
          </div>
          <textarea
            placeholder="Type your message here..."
            className="w-full h-40 p-2 rounded-lg mb-5 bg-white"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded w-20 content-center mt-5"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
