"use client";

import {
    createContext,
    useState,
    ReactNode,
    useEffect,
    Dispatch,
    SetStateAction,
    useContext,
} from "react";

import { getUserProfile, getUserProfileByEmail } from "@/services/user";
import { UserProfile } from "@/types/userProfile";

interface UserContextType {
    currentUser: UserProfile | null;
    setCurrentUser: Dispatch<SetStateAction<UserProfile | null>>;
    loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Add a loading state

    // This effect runs once when the app loads
    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true);
            try {
                const storedUID = localStorage.getItem("userUID");
                if (storedUID) {
                    // If a user ID is in storage, fetch their full profile
                    const userProfile: UserProfile = await getUserProfile(
                        storedUID
                    );
                    setCurrentUser(userProfile);
                } else {
                    throw new Error("No user UID found in localStorage");
                }
            } catch (error) {
                console.error("Session restore failed:", error);
                // Clear out any bad data if the fetch fails
                localStorage.removeItem("userUID");
                setCurrentUser(null);

                // For now, just set current user to Alice all the time
                const aliceProfile: UserProfile = await getUserProfileByEmail(
                    "alice@rit.edu"
                );
                setCurrentUser(aliceProfile);
            } finally {
                setLoading(false);
            }
        };
        loadUserData();
    }, []);

    const value = {
        currentUser,
        setCurrentUser,
        loading, // Expose loading state
    };

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}
export function useAuth() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useAuth must be used within a UserProvider");
    }
    return context;
}
