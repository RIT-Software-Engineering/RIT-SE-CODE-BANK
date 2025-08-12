//This is very big, I know. This should probly be broken up into smaller components to make it more manageable.
'use client';
import { useEffect, useState } from "react";
import "./user.css";

export default function UserPage() {
    const [username, setUsername] = useState("");
    const [userTeams, setUserTeams] = useState([]);
    const [popupUser, setPopupUser] = useState(null);
    const [editPopup, setEditPopup] = useState(false);
    const [userInfo, setUserInfo] = useState({ firstName: "", lastName: "", email: "" });

    useEffect(() => {
        const storedUsername =
            typeof window !== "undefined"
                ? localStorage.getItem("username")
                : "";
        setUsername(storedUsername || "");

        if (storedUsername) {
            // Fetch user details for contact info
            fetch(`http://localhost:3000/api/user/${encodeURIComponent(storedUsername)}/details`)
                .then(res => res.json())
                .then(userData => {
                    if (userData) {
                        setUserInfo({
                            firstName: userData.firstName || "",
                            lastName: userData.lastName || "",
                            email: userData.email || ""
                        });
                    }
                })
                .catch(error => console.log("Error fetching user details:", error));

            // Fetch user teams
            fetch(`http://localhost:3000/api/user?username=${encodeURIComponent(storedUsername)}`)
                .then(res => res.json())
                .then(userData => {
                    if (!userData || !userData.id) return;
                    fetch(`http://localhost:3000/api/user/${userData.id}/teams`)
                        .then(res => res.json())
                        .then(data => {
                            setUserTeams(data.teams || []);
                        });
                });
        }
    }, []);

    const getTeammates = (team) => {
        if (!team || !team.users) return [];
        return team.users.map(u => u.username);
    };

    const teamsByCommunity = userTeams.reduce((acc, t) => {
        const commName = t.community?.name || "Unknown Community";
        if (!acc[commName]) acc[commName] = [];
        acc[commName].push(t);
        return acc;
    }, {});

    const EditContactPopup = ({ user, info, onClose, onSave }) => {
        const [firstName, setFirstName] = useState(info.firstName || "");
        const [lastName, setLastName] = useState(info.lastName || "");
        const [email, setEmail] = useState(info.email || "");
        const [saving, setSaving] = useState(false);
        const [error, setError] = useState("");

        const handleSave = async () => {
            setSaving(true);
            setError("");

            try {
                const response = await fetch(`http://localhost:3000/api/user/${encodeURIComponent(user)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName: firstName.trim() || null,
                        lastName: lastName.trim() || null,
                        email: email.trim() || null
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to update user information');
                    setSaving(false);
                    return;
                }

                console.log('User updated successfully:', data.message);
                onSave({ firstName, lastName, email });
                onClose();
            } catch (error) {
                console.error('Error updating user:', error);
                setError('Server error. Please try again.');
                setSaving(false);
            }
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
                    <h2>Edit Personal Information</h2>
                    {error && <div className="user-error-message">{error}</div>}
                    <div className="user-edit-contact-form">
                        <label>
                            First Name:
                            <input
                                type="text"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                disabled={saving}
                            />
                        </label>
                        <label>
                            Last Name:
                            <input
                                type="text"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                disabled={saving}
                            />
                        </label>
                        <label>
                            Email:
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={saving}
                            />
                        </label>
                        <button 
                            className="user-edit-contact-save" 
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const ContactPopup = ({ user, onClose }) => {
        const [contact, setContact] = useState({ firstName: "", lastName: "", email: "" });
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            fetch(`http://localhost:3000/api/user/${encodeURIComponent(user)}/details`)
                .then(res => res.json())
                .then(userData => {
                    if (userData) {
                        setContact({
                            firstName: userData.firstName || "Not provided",
                            lastName: userData.lastName || "Not provided",
                            email: userData.email || "Not provided"
                        });
                    }
                    setLoading(false);
                })
                .catch(error => {
                    console.log("Error fetching contact info:", error);
                    setLoading(false);
                });
        }, [user]);

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
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <div>
                            <div>
                                <strong>First Name:</strong> {contact.firstName}
                            </div>
                            <div>
                                <strong>Last Name:</strong> {contact.lastName}
                            </div>
                            <div>
                                <strong>Email:</strong> {contact.email}
                            </div>
                        </div>
                    )}
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
                    Edit Personal Information
                </button>
            </div>
            <h2>Teams for {username}</h2>
            {userTeams.length === 0 ? (
                <p>You are not on any teams.</p>
            ) : (
                <div className="user-communities-container">
                    {Object.entries(teamsByCommunity).map(([community, teams]) => (
                        <div className="user-community-box" key={community}>
                            <h3>{community}</h3>
                            {teams.map((team) => (
                                <div className="user-team-box" key={team.id}>
                                    <strong>{team.name}</strong>
                                    <div className="user-team-teammates">
                                        <span className="user-team-teammates-label">Teammates:</span>
                                        <ul className="user-team-teammates-list">
                                            {getTeammates(team).map((user, idx2) => (
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
            {popupUser && (
                <ContactPopup user={popupUser} onClose={() => setPopupUser(null)} />
            )}
            {editPopup && (
                <EditContactPopup
                    user={username}
                    info={userInfo}
                    onClose={() => setEditPopup(false)}
                    onSave={newInfo => setUserInfo(newInfo)}
                />
            )}
        </div>
    );
}