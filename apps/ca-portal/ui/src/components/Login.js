"use client";
import { useState } from "react";
import { ROLES_ARRAY } from "@/configuration/dashboard.config";

export default function Login({ onLoginSuccess = () => {} }) {
  function handleSignIn() {
    const roleToSend = selectedRole;

    onLoginSuccess(roleToSend);

    setIsLoggedIn(true);
    console.log(`${selectedRole} signed in`);
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Sets default role to the first in the array 
  const [selectedRole, setSelectedRole] = useState(ROLES_ARRAY[0]);
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
          <fieldset className="flex gap-x-6">
            {ROLES_ARRAY.map((role) => (
              <div className="flex items-center" key={role}>
                <input
                  type="radio"
                  id={`role_${role}`}
                  name="role_selection"
                  value={role}
                  checked={selectedRole === role}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-4 w-4 text-rit-orange focus:ring-rit-orange border-gray-300"
                />
                <label
                  htmlFor={`role_${role}`}
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  {role}
                </label>
              </div>
            ))}
          </fieldset>
          <button
            className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800"
            onClick={handleSignIn}
          >
            Sign In
          </button>
        </div>
      </div>
    </>
  );
}

