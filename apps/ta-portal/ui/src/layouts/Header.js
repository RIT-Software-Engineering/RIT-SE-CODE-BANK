// src/components/Header.js
"use client";
import Link from "next/link";
import { ROLES } from "@/configuration/dashboard.config";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const HEADER_LINKS = [
  {
    text: "Home",
    href: "/",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
  {
    text: "Messaging",
    href: "/Messaging",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
  { text: "Timecard", href: "/Timecard/Employee/[username]", roles: [ROLES.EMPLOYEE] },
  {
    text: "Timecard",
    href: "/Timecard/Admin/[username]",
    roles: [ROLES.ADMIN], 
  },
  {
    text: "Timecard",
    href: "/Timecard/Employer/[username]",
    roles: [ROLES.EMPLOYER], 
  },
  {
    text: "Positions",
    href: "/Positions/Candidate/[username]",
    roles: [ROLES.CANDIDATE],
  },
  {
    text: "Positions",
    href: "/Positions/Employer/[username]",
    roles: [ROLES.EMPLOYER],
  },
  {
    text: "Positions",
    href: "/Positions/Employee/[username]",
    roles: [ROLES.EMPLOYEE],
  },
  {
    text: "Positions",
    href: "/Positions/Admin/[username]",
    roles: [ROLES.ADMIN],
  },
  {
    text: "Applications",
    href: "/Applications/Candidate/[username]",
    roles: [ROLES.CANDIDATE],
  },
  {
    text: "Applications",
    href: "/Applications/Employer/[username]",
    roles: [ROLES.EMPLOYER],
  },
  {
    text: "Applications",
    href: "/Applications/Employee/[username]",
    roles: [ROLES.EMPLOYEE],
  },
  {
    text: "Applications",
    href: "/Applications/Admin/[username]",
    roles: [ROLES.ADMIN],
  },
  {
    text: "Users",
    href: "/Users",
    roles: [ROLES.ADMIN],
  },
  {
    text: "Profile",
    href: "/Profile",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
];

export default function Header() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const userRole = currentUser ? currentUser.role : null;

  const availableLinks = HEADER_LINKS.filter((link) =>
    link.roles.includes(userRole)
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="bg-rit-orange p-4 flex flex-row">
      <div id="Logo" className="text-left pl-10">
        <h1 className="text-4xl font-bold">Teaching Assistant Portal</h1>
        <h3>Department of Software Engineering, RIT </h3>
      </div>
      <nav className="pb-2 mt-2 text-white text-lg text-right flex-grow space-x-4 pr-10">
        {availableLinks.map((link) => {
          const finalHref = link.href.includes("[username]") && currentUser
              ? link.href.replace("[username]", currentUser.username)
              : link.href;

          return (
            <Link key={finalHref} href={finalHref}>
              {link.text}
            </Link>
          );
        })}

        {currentUser && (
          <button
            onClick={handleLogout}
            className="bg-white text-rit-orange font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-200"
          >
            Logout
          </button>
        )}
      </nav>
    </div>
  );
}
