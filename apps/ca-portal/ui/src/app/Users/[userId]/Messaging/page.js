// src/app/Users/[userId]/Messaging/page.js
'use client'
import { useParams } from "next/navigation";

export default function Messaging() {
    const { userId } = useParams();
    return (
        <>
            <div className="h-auto bg-rit-gray p-20 w-2/3 m-auto mt-20">
                <div className="bg-rit-light-gray h-full flex flex-col p-10 rounded-lg">
                        <div className="text-left mb-5">
                        <h2>Sending a message to {userId}:</h2>
                        </div>
                    <textarea placeholder="Type your message here..." className="w-full h-40 p-2 rounded-lg mb-5 bg-white" />
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded w-20 content-center mt-5">Send</button>
                </div>
            </div>
        </>
    );
}