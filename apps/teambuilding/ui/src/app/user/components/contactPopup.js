import { useEffect, useState } from "react";
import { fetchUserDetails } from "../api/userApi";

export default function ContactPopup({ user, onClose }) {
    const [contact, setContact] = useState({
        firstName: "",
        lastName: "",
        email: "",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDetails(user)
            .then(userData => {
                if (userData) {
                    setContact({
                        firstName: userData.firstName || "Not provided",
                        lastName: userData.lastName || "Not provided",
                        email: userData.email || "Not provided",
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
            <div
                className="user-popup-content"
                onClick={e => e.stopPropagation()}
            >
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
}
