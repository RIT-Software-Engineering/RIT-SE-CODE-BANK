"use client";
import { useState } from "react";
import UserCard from "./UserCard";

export default function UserGroup({ title, users, onEditUser }) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 focus:outline-none">
                <h3 className="text-xl font-bold text-gray-700">{title} ({users.length})</h3>
                <svg className={`w-6 h-6 transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {!isCollapsed && (
                <div className="p-4 border-t border-gray-200">
                    {users.map(user => <UserCard key={user.uid} user={user} onEdit={onEditUser} />)}
                </div>
            )}
        </div>
    );
}