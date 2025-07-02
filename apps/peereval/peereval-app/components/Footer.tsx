'use client';

import { useUserContext } from "@/context/UserContext"

export default function Footer() {
    const {userId, setUserId} = useUserContext();

    return (
        <footer className="mt-4 p-4 bg-black text-white text-center">
            <p>© 2025 Peer Eval. All rights reserved.</p>
            <button
                className="mt-2 px-4 py-2 bg-white text-black rounded"
                onClick={() => setUserId(userId === "1" ? "10" : "1")}
            >
                Toggle User ID (Current: {userId})
            </button>
        </footer>
    )
}