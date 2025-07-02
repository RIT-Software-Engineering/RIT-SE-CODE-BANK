'use client';
import { useEffect, useState } from "react";
import "./user.css"; // Make sure this is imported

// Dummy data for demonstration; replace with real data source as needed
const dummyCommunities = [
    {
        name: "Class 0",
        teams: [
            { name: "Team 1", users: ["alice", "bob"] },
            { name: "Team 2", users: ["charlie", "dave"] },
        ],
    },
    {
        name: "Class 1",
        teams: [
            { name: "Team 1", users: ["alice", "eve"] },
            { name: "Team 2", users: ["frank"] },
        ],
    },
];

// Dummy contact info for demonstration
const dummyContacts = {
    alice: { email: "alice@example.com", phone: "555-1111" },
    bob: { email: "bob@example.com", phone: "555-2222" },
    charlie: { email: "charlie@example.com", phone: "555-3333" },
    dave: { email: "dave@example.com", phone: "555-4444" },
    eve: { email: "eve@example.com", phone: "555-5555" },
    frank: { email: "frank@example.com", phone: "555-6666" },
    grace: { email: "grace@example.com", phone: "555-7777" },
    heidi: { email: "heidi@example.com", phone: "555-8888" },
    ivan: { email: "ivan@example.com", phone: "555-9999" },
    judy: { email: "judy@example.com", phone: "555-0000" },
    mallory: { email: "mallory@example.com", phone: "555-1212" },
    oscar: { email: "oscar@example.com", phone: "555-2323" },
    peggy: { email: "peggy@example.com", phone: "555-3434" },
    jordan: { email: "jordan@example.com", phone: "555-4545" },
};

export default function UserPage() {
    const [username, setUsername] = useState("");
    const [userTeams, setUserTeams] = useState([]);
    const [userCommunities, setUserCommunities] = useState([]);
    const [popupUser, setPopupUser] = useState(null);
    const [editPopup, setEditPopup] = useState(false);
    const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });

    // Helper to get communities (no localStorage, just dummy)
    const getCommunities = () => {
        return dummyCommunities;
    };

    useEffect(() => {
        const storedUsername =
            typeof window !== "undefined"
                ? localStorage.getItem("username")
                : "";
        setUsername(storedUsername || "");

        // Always use dummyCommunities, never localStorage
        const communities = getCommunities();
        setUserCommunities(communities);

        if (storedUsername) {
            const teams = [];
            communities.forEach((community) => {
                community.teams.forEach((team) => {
                    if (team.users.includes(storedUsername)) {
                        teams.push({
                            community: community.name,
                            team: team.name,
                        });
                    }
                });
            });
            setUserTeams(teams);

            // Load contact info for edit popup
            if (dummyContacts[storedUsername]) {
                setContactInfo({
                    email: dummyContacts[storedUsername].email,
                    phone: dummyContacts[storedUsername].phone,
                });
            } else {
                setContactInfo({ email: "", phone: "" });
            }
        }
    }, [typeof window !== "undefined" ? localStorage.getItem("username") : ""]);

    // Button handler to create a named user in 4 different teams, with 2 teams in one community and the other 2 each in their own
    const createTempUserAndTeams = () => {
        // This only updates state, not localStorage
        const tempUsername = "jordan";
        const communities = [
            {
                name: "Robotics Club",
                teams: [
                    { name: "Builders", users: [tempUsername, "alice", "bob"] },
                    { name: "Programmers", users: ["charlie", tempUsername, "dave"] },
                ],
            },
            {
                name: "Mathletes",
                teams: [
                    { name: "Algebra Squad", users: ["eve", tempUsername] },
                ],
            },
            {
                name: "Science Bowl",
                teams: [
                    { name: "Quiz Masters", users: ["frank", "grace", tempUsername] },
                ],
            },
        ];
        setUsername(tempUsername);
        setUserCommunities(communities);
        // Update userTeams immediately
        const teams = [];
        communities.forEach((community) => {
            community.teams.forEach((team) => {
                if (team.users.includes(tempUsername)) {
                    teams.push({
                        community: community.name,
                        team: team.name,
                    });
                }
            });
        });
        setUserTeams(teams);
    };

    // Helper to get teammates for a given community and team
    const getTeammates = (communityName, teamName) => {
        const community = userCommunities.find((c) => c.name === communityName);
        if (!community) return [];
        const team = community.teams.find((t) => t.name === teamName);
        if (!team) return [];
        return team.users;
    };

    // Group userTeams by community for display
    const teamsByCommunity = userTeams.reduce((acc, t) => {
        if (!acc[t.community]) acc[t.community] = [];
        acc[t.community].push(t.team);
        return acc;
    }, {});

    // Edit Contact Info Popup
    const EditContactPopup = ({ user, info, onClose, onSave }) => {
        const [email, setEmail] = useState(info.email || "");
        const [phone, setPhone] = useState(info.phone || "");

        const handleSave = () => {
            onSave({ email, phone });
            onClose();
        };

        return (
            <div className="user-popup-overlay" onClick={onClose}>
                <div className="user-popup-content" onClick={e => e.stopPropagation()}>
                    <button
                        className="user-popup-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <h2>Edit Contact Information</h2>
                    <div className="user-edit-contact-form">
                        <label>
                            Email:
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </label>
                        <label>
                            Phone:
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </label>
                        <button className="user-edit-contact-save" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Save handler for contact info
    const handleSaveContactInfo = (newInfo) => {
        setContactInfo(newInfo);
        // Optionally update dummyContacts in memory for this session
        if (username) {
            dummyContacts[username] = { ...newInfo };
        }
    };

    // Popup for contact info
    const ContactPopup = ({ user, onClose }) => {
        const contact = dummyContacts[user] || { email: "unknown", phone: "unknown" };
        return (
            <div className="user-popup-overlay" onClick={onClose}>
                <div className="user-popup-content" onClick={e => e.stopPropagation()}>
                    <button
                        className="user-popup-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <h2>{user}</h2>
                    <div>
                        <strong>Email:</strong> {contact.email}
                    </div>
                    <div>
                        <strong>Phone:</strong> {contact.phone}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="user-header-row">
                <h1>User Page</h1>
                <button
                    className="user-edit-contact-btn"
                    onClick={() => setEditPopup(true)}
                >
                    Edit Contact Information
                </button>
            </div>
            <h2>Teams for {username}</h2>
            {userTeams.length === 0 ? (
                <p>You are not on any teams.</p>
            ) : (
                <div className="user-communities-container">
                    {Object.entries(teamsByCommunity).map(([community, teams], idx) => (
                        <div className="user-community-box" key={community}>
                            <h3>{community}</h3>
                            {teams.map((teamName, i) => (
                                <div className="user-team-box" key={teamName}>
                                    <strong>{teamName}</strong>
                                    <div className="user-team-teammates">
                                        <span className="user-team-teammates-label">Teammates:</span>
                                        <ul className="user-team-teammates-list">
                                            {getTeammates(community, teamName).map((user, idx2) => (
                                                <li
                                                    key={idx2}
                                                    className={`user-teammate${user === username ? " user-teammate-self" : ""}`}
                                                    onClick={() => setPopupUser(user)}
                                                >
                                                    {user}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            <button
                className="user-tempuser-btn"
                onClick={createTempUserAndTeams}
                title="Create temp user in 4 teams"
            >
                Temp User (4 Teams)
            </button>
            {popupUser && (
                <ContactPopup user={popupUser} onClose={() => setPopupUser(null)} />
            )}
            {editPopup && (
                <EditContactPopup
                    user={username}
                    info={contactInfo}
                    onClose={() => setEditPopup(false)}
                    onSave={handleSaveContactInfo}
                />
            )}
        </div>
    );
}