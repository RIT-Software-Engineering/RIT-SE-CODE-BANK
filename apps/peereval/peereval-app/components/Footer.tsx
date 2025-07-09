"use client";

import { useAuth } from "@/context/UserContext";
import { getAllUserProfiles } from "@/services/user";
import { UserProfile } from "@/types/userProfile";
import { useEffect, useState } from "react";

export default function Footer() {
    const { currentUser, setCurrentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
        (async () => {
            const us = await getAllUserProfiles();
            setUsers(us);
        })();
    }, []);

    return (
        <footer className="mt-4 p-4 bg-black text-white text-center">
            <p>© 2025 Peer Eval. All rights reserved.</p>
            <div className="flex items-center justify-center mt-2">
                <span className="mr-2">Current user:</span>
                <select
                    className="px-4 py-2 bg-white text-black rounded"
                    value={currentUser?.id ?? ""}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        setCurrentUser(users.find((u) => u.id == selectedId)!);
                    }}
                >
                    <option value="" disabled>
                        Select User
                    </option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>
        </footer>
    );
}
