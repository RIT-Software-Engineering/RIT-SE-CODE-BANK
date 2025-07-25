"use client";

export default function UserCard({ user, onEdit }) {
    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow mb-4 flex justify-between items-center">
        <div>
            <p className="font-bold text-lg text-gray-800">{user.name}</p>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-900 font-semibold">{user.role}</p>
        </div>
        <button
            onClick={() => onEdit(user.uid)}
            className="px-4 py-2 bg-rit-orange text-white rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-rit-orange focus:ring-opacity-50"
        >
            Edit
        </button>
        </div>
    );
}