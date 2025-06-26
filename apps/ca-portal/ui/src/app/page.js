// src/app/page.js (home page)
"use client";
import { useState } from "react";
import Login from "@/components/Login";
import Link from "next/link";
import SelectionCard from "@/components/SelectionCard";
import LandingDashboard from "@/components/LandingDashboard";

// const DevelopmentView = () => (
//   <>
//           <div className="bg-white h-screen p-10 pl-10">
//             <div>
//               <h1 className="text-3xl ">Personal</h1>
//               <div className="flex flex-row items-start">
//                 <SelectionCard text="View Time Card" link="/Timecard" />
//                 <SelectionCard text="Kronos" link="" />
//                 <SelectionCard text="My Courses" link="" />
//                 <SelectionCard text="Send Message" link="/Messaging" />
//               </div>
//             </div>
//             <div>
//               <h1 className="text-3xl">Explore</h1>
//               <div className="flex justify-center">
//                 <Link href={"/Positions"} className="w-full flex justify-center">
//                 <button
//                   className="bg-white border-2 border-rit-light-gray min-h-44 rounded-xl p-6 m-8 flex flex-col items-center justify-center w-4/5 shadow hover:bg-[#fff4e6] hover:scale-105  transition duration-200 ease-in-out hover:shadow-lg cursor-pointer"
//                 >
//                   <span className="text-xl font-semibold text-rit-orange">Find Positions</span>
//                 </button>
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </>
// )



export default function Home() {
  const [userRole, setUserRole] = useState(null);

  const handleLoginSuccess = (userRole) =>{
    setUserRole(userRole);
  }

  return (
    <>
      {!userRole && (
        <Login onLoginSuccess={handleLoginSuccess}/>
      )}
      {/* Development view */}
      {userRole && (
        <LandingDashboard userRole={userRole}/>
      )}
    </>
  );
}
