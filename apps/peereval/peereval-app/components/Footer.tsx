"use client";

import { useAuth } from "@/context/UserContext";
import { getUserProfile, getUserProfileByEmail } from "@/services/user";
import { UserProfile } from "@/types/userProfile";
import { useEffect, useState } from "react";

export default function Footer() {
    const { currentUser, setCurrentUser } = useAuth();
    const [aliceUser, setAliceUser] = useState<UserProfile>({
        id: "d117ad29-814d-47de-aa4b-11723a7440de",
        name: "Alice",
        email: "alice@rit.edu",
    });
    const [zebraUser, setZebraUser] = useState<UserProfile>({
        id: "2a18ce36-0b42-475b-855a-0aa62fa4ba07",
        name: "Zebra",
        email: "zebra@rit.edu",
    });

    useEffect(() => {
        const getTheInfos = async () => {
            setAliceUser(await getUserProfileByEmail("alice@rit.edu"));
            setZebraUser(await getUserProfileByEmail("zebra@rit.edu"));
        };

        getTheInfos();
    }, []);

    return (
        <footer className="mt-4 p-4 bg-black text-white text-center">
            <p>© 2025 Peer Eval. All rights reserved.</p>
            <button
                className="mt-2 px-4 py-2 bg-white text-black rounded"
                onClick={() =>
                    setCurrentUser(
                        currentUser?.id === aliceUser.id ? zebraUser : aliceUser
                    )
                }
            >
                Toggle User ID (Current: {currentUser?.name ?? "None"})
            </button>
        </footer>
    );
}
