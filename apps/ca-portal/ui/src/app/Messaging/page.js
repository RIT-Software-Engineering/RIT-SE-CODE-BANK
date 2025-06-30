// src/app/Messaging/page.js
'use client'
import { useState, useEffect } from "react";
import { getSlackOAuthURL, sendMessageToSlack } from "../../services/slack-apis"; // Adjust the import path as needed

export default function Messaging() {
    // State to hold the token and team ID from the URL after Slack redirect
    const [slackToken, setSlackToken] = useState(null);
    const [teamId, setTeamId] = useState(null);

    // State for the form inputs
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    // State for loading and feedback messages
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // This effect runs once when the component loads.
    // Its job is to check the URL for the token and teamId that Slack sends back.
    useEffect(() => {
        // Use URLSearchParams to easily read query parameters from the browser's URL
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');
        const team = queryParams.get('teamId');
        const error = queryParams.get('error');

        if (token && team) {
            console.log("Token and TeamId found in URL.");
            setSlackToken(token);
            setTeamId(team);

            // Optional: Clean the URL so the token doesn't stay in the address bar.
            // This prevents it from being re-used on a page refresh.
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (error) {
            console.error("OAuth Error:", error);
            setFeedback({ type: 'error', message: `Authentication failed: ${error}` });
        }
    }, []); // The empty array [] means this effect runs only once on mount.

    /**
     * Handles the "Connect to Slack" button click.
     * It calls the backend to get the auth URL and redirects the user.
     */
    const handleConnectToSlack = async () => {
        setIsLoading(true);
        setFeedback({ type: '', message: '' });
        try {
            const oauthUrl = await getSlackOAuthURL();
            // Redirect the user to the Slack authorization page
            window.location.href = oauthUrl;
        } catch (error) {
            console.error("Failed to get Slack OAuth URL:", error);
            setFeedback({ type: 'error', message: error.message });
            setIsLoading(false);
        }
    };

    /**
     * Handles the message form submission.
     * It calls the backend to send the message via Slack.
     */
    const handleSendMessage = async (event) => {
        event.preventDefault(); // Prevent the form from doing a full page reload
        if (!email || !message) {
            setFeedback({ type: 'error', message: 'Email and message cannot be empty.' });
            return;
        }

        setIsLoading(true);
        setFeedback({ type: '', message: '' });

        try {
            const result = await sendMessageToSlack({
                token: slackToken,
                teamId: teamId,
                email: email,
                text: message,
            });

            console.log("API Response:", result);
            setFeedback({ type: 'success', message: result.message });
            // Clear the form on success
            setEmail('');
            setMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
            setFeedback({ type: 'error', message: `Error: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-auto bg-rit-gray p-10 md:p-20 w-full md:w-2/3 m-auto mt-10 md:mt-20 rounded-xl">
            <div className="bg-rit-light-gray h-full flex flex-col p-6 md:p-10 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-rit-dark-gray mb-6 text-center">Send a Slack Message</h1>
                
                {/* Conditionally render the connect button or the message form */}
                {!slackToken ? (
                    // STATE 1: Not authenticated
                    <div className="text-center">
                        <p className="mb-4 text-gray-700">Please connect your Slack account to continue.</p>
                        <button
                            onClick={handleConnectToSlack}
                            disabled={isLoading}
                            className="bg-rit-orange hover:bg-rit-dark-orange text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Redirecting...' : 'Connect to Slack'}
                        </button>
                    </div>
                ) : (
                    // STATE 2: Authenticated, show the form
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
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Display feedback messages to the user */}
                {feedback.message && (
                    <div className={`mt-6 p-3 rounded-lg text-center ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {feedback.message}
                    </div>
                )}
            </div>
        </div>
    );
}