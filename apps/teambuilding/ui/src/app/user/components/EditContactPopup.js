import { useState } from "react";
import { updateUser } from "../api/userApi";

export default function EditContactPopup({ user, info, onClose, onSave }) {
    const [firstName, setFirstName] = useState(info.firstName || "");
    const [lastName, setLastName] = useState(info.lastName || "");
    const [email, setEmail] = useState(info.email || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setSaving(true);
        setError("");

        try {
            const { response, data } = await updateUser(user, {
                firstName,
                lastName,
                email,
            });

            if (!response.ok) {
                setError(data.error || "Failed to update user information");
                setSaving(false);
                return;
            }

            onSave({ firstName, lastName, email });
            onClose();
        } catch (error) {
            console.error("Error updating user:", error);
            setError("Server error. Please try again.");
            setSaving(false);
        }
    };

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

                <h2>Edit Personal Information</h2>

                {error && (
                    <div className="user-error-message">{error}</div>
                )}

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
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
