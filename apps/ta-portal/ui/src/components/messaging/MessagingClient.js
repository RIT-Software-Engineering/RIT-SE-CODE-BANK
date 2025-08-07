// src/components/messaging/MessagingClient.js
"use client";

import { useState, useEffect } from "react";
import { getSlackOAuthURL, sendMessageToSlack } from "@/services/slack-apis";

export default function MessagingClient({ initialEmail = "" }) {
  const [slackToken, setSlackToken] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
    const team = queryParams.get("teamId");
    const error = queryParams.get("error");

    if (token && team) {
      setSlackToken(token);
      setTeamId(team);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (error) {
      setFeedback({
        type: "error",
        message: `Authentication failed: ${error}`,
      });
    }
  }, []);

  const handleConnectToSlack = async () => {
    setIsLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const oauthUrl = await getSlackOAuthURL(email);
      window.location.href = oauthUrl;
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!email || !message) {
      setFeedback({
        type: "error",
        message: "Email and message cannot be empty.",
      });
      return;
    }
    setIsLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const result = await sendMessageToSlack({
        token: slackToken,
        teamId: teamId,
        email: email,
        text: message,
      });
      setFeedback({ type: "success", message: result.message });
      setEmail("");
      setMessage("");
    } catch (error) {
      setFeedback({ type: "error", message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-auto bg-rit-gray p-10 md:p-20 w-full md:w-2/3 m-auto mt-10 md:mt-20 rounded-xl">
      <div className="bg-rit-light-gray h-full flex flex-col p-6 md:p-10 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-rit-dark-gray mb-6 text-center">
          Send a Slack Message
        </h1>
        {!slackToken ? (
          <div className="text-center">
            <p className="mb-4 text-gray-700">
              Please connect your Slack account to continue.
            </p>
            <button
              onClick={handleConnectToSlack}
              disabled={isLoading}
              className="bg-rit-orange hover:bg-rit-dark-orange text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400"
            >
              {isLoading ? "Redirecting..." : "Connect to Slack"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage}>
            <input
              type="email"
              placeholder="Enter recipient's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-5 w-full p-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rit-orange"
              required
            />
            <textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-40 p-3 rounded-lg mb-5 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rit-orange"
              required
            />
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-rit-orange hover:bg-rit-dark-orange text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:bg-gray-400"
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
        {feedback.message && (
          <div
            className={`mt-6 p-3 rounded-lg text-center ${
              feedback.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}