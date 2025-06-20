import { useParams } from "react-router";
import { useState } from "react";


export default function Messaging() {
    const { userId } = useParams();
    return (
        <>
            <div className="h-auto bg-rit-gray p-20 w-2/3 m-auto mt-20">
                <div className="bg-rit-light-gray h-full flex flex-col p-10 rounded-lg">
                    {userId ? (
                        <div className="text-left mb-5">
                        <h2>Sending a message to {userId}:</h2>
                        </div>
                        ):(
                            <>
                            <input placeholder="Enter User ID" className="mb-5 w-1/4"/>
                            </>
                        )}
                    <textarea placeholder="Type your message here..." className="w-full h-40 p-2 rounded-lg mb-5" />
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded w-20 content-center mt-5">Send</button>
                </div>
            </div>
        </>
    );
}