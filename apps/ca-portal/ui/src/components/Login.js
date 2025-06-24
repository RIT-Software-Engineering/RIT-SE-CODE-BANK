"use client";
import { useState } from "react";

export default function Login(props) {
  function handleSignIn() {
    setIsLoggedIn(true);
    props.setIsLoggedIn(true);
    console.log("User signed in");
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
