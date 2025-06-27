"use client";
import { useState } from "react";

const exampleUsers = [
  {
    "uid": 100,
    "name": "Alice Admin",
    "email": "admin@example.com",
    "pronouns": "they/them",
    "role": "ADMIN"
  },
  {
    "uid": 200,
    "name": "Dr. Bob Brown",
    "email": "faculty1@example.com",
    "pronouns": "he/him",
    "role": "EMPLOYER"
  },
  {
    "uid": 301,
    "name": "Charlie Coder",
    "email": "student1@example.com",
    "pronouns": "he/him",
    "role": "EMPLOYEE"
  },
    {
    "uid": 303,
    "name": "Evan Engineer",
    "email": "student3@example.com",
    "pronouns": "they/them",
    "role": "STUDENT"
  },
]


export default function Login({ onLoginSuccess = () => {} }) {
  // Sets default role to the first in the array 
  const [selectedUser, setSelectedUser] = useState(exampleUsers[0]);

  return (
    <>
      <div className="bg-white">
        <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
          <div className="text-center text-3xl w-1/2">
            Welcome to the RIT Course Assistant Portal
            <br />
            <br />
            Sign in with your RIT Account
          </div>
          <div className="mt-6">
            <label htmlFor="user_select" className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              id="user_select"
              value={selectedUser.uid}
              onChange={e => {
                const user = exampleUsers.find(u => u.uid === Number(e.target.value));
                setSelectedUser(user);
                console.log(`Selected user: ${user.name} (${user.role})`);
              }}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-rit-orange focus:ring focus:ring-rit-orange focus:ring-opacity-50 p-2"
            >
              {exampleUsers.map(user => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800"
            onClick={() => {
              onLoginSuccess(selectedUser);
              console.log(`${selectedUser.role} signed in`);
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </>
  );
}

