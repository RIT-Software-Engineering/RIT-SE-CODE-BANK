// src/app/page.js (home page)
"use client";
import { useState } from "react";
import Login from "@/components/Login";
import Link from "next/link";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      {!isLoggedIn && (
        <Login isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      )}
      {isLoggedIn && (
        <>
          <div  className="bg-white h-screen">
            <div className="bg-rit-light-gray h-auto rounded-lg p-5 m-10 justify-center items-center flex flex-col w-1/4">
              test
              <Link href={"/Positions"} className="text-blue-600 hover:underline">Positions</Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
