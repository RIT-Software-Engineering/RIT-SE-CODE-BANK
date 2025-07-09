"use client";

import {
    createContext,
    useState,
    ReactNode,
    useEffect,
    useContext,
} from "react";

import { getUserProfile, getUserProfileByEmail } from "@/services/user";
import { UserProfile } from "@/types/userProfile";

interface AuthContextType {
    currentUser: UserProfile | null;
    setCurrentUser: (user: UserProfile | null) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, _setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Add a loading state

    const setCurrentUser = (user: UserProfile | null) => {
        _setCurrentUser(user);
        if (user) localStorage.setItem("userUID", user.id);
        else localStorage.removeItem("useruID");
    };

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
                    // // Clear out any bad data if the fetch fails
                    // localStorage.removeItem("userUID");
                    // setCurrentUser(null);

                    // For now, just set current user to Alice all the time if no user
                    const aliceProfile: UserProfile =
                        await getUserProfileByEmail("alice@rit.edu");
                    setCurrentUser(aliceProfile);
                }
            } catch (error) {
                console.error("Session restore failed:", error);
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
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within a UserProvider");
    }
    return context;
}
