// app/components/UserProfileModal.js
'use client';
import { useState, useEffect } from "react";
import UserProfileForm from "./UserProfileForm";

/**
 * Wrapper component that controls the visibility of the {@link UserProfileForm} modal
 * 
 * @param {Object} passedUser - The passed in user object whose profile to edit (required) 
 * @returns A modal containing the {@link UserProfileForm} or null if closed
 */
export default function UserProfileModal({ user: passedUser }) {
    const [user, setUser] = useState(passedUser);
    const [isOpen, setIsOpen] = useState(true); // defaults the modal to open when called
    const [mode, setMode] = useState("create"); // or "edit"

    useEffect(() => {
        if (!passedUser?.id) {
            console.error("UserProfileModal requires a user with an id.");
            return;
        }

        const fetchUserData = async () => {
            // TODO: Replace this with call to DB
            const fetchedUser = {
                id: passedUser.id,
                fullName: "",
                pronouns: "",
                major: "",
                courses: [],
                graduateStatus: "",
                isEmployee: false,
                coursesWorked: [],
                profileComplete: true // replace profile complete with 
            };

            setUser(fetchedUser);
            setMode(fetchedUser.profileComplete ? "edit" : "create");
            setIsOpen(true);
        };

        fetchUserData();
    }, [passedUser]);

    if (!isOpen || !user) return null;

    return (
        <UserProfileForm
        user={user}
        mode={mode}
        onClose={() => setIsOpen(false)}
        />
    );
}