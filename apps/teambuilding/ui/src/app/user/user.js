'use client';
import { useEffect, useState } from "react";
import "./user.css";

export default function UserPage() {
    const [username, setUsername] = useState("");
    const [userTeams, setUserTeams] = useState([]);
    const [popupUser, setPopupUser] = useState(null);
    const [editPopup, setEditPopup] = useState(false);
    const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });

    useEffect(() => {
        const storedUsername =
            typeof window !== "undefined"
                ? localStorage.getItem("username")
                : "";
        setUsername(storedUsername || "");

        if (storedUsername) {
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

    const ContactPopup = ({ user, onClose }) => {
        const contact = { email: "unknown", phone: "unknown" };
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
                    info={contactInfo}
                    onClose={() => setEditPopup(false)}
                    onSave={newInfo => setContactInfo(newInfo)}
                />
            )}
        </div>
    );
}