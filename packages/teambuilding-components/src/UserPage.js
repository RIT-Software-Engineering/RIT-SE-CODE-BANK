'use client';

import { useState } from "react";
import EditContactPopup from "./EditContactPopup";
import ContactPopup from "./ContactPopup";
import TeamList from "./TeamList";
import { useUser } from "./hooks/useUser";
import "./styles/user.css";

export default function UserPage() {
    const {
        username,
        userTeams,
        userInfo,
        setUserInfo,
        teamsByCommunity,
    } = useUser();

    const [popupUser, setPopupUser] = useState(null);
    const [editPopup, setEditPopup] = useState(false);

    return (
        <div>
            <div className="user-header-row">
                
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
                <TeamList
                    teamsByCommunity={teamsByCommunity}
                    username={username}
                    onUserClick={setPopupUser}
                />
            )}

            {popupUser && (
                <ContactPopup
                    user={popupUser}
                    onClose={() => setPopupUser(null)}
                />
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
