// src/components/Header.js
"use client";
import Link from "next/link";
import { ROLES } from "@/configuration/dashboard.config";
import { useAuth } from "@/contexts/AuthContext";

const HEADER_LINKS = [
  {
    text: "Home",
    href: "/",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
  { text: "Users", href: "/Users", roles: [ROLES.ADMIN] },
  {
    text: "Messaging",
    href: "/Messaging",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
  { text: "Timecard", href: "/Timecard", roles: [ROLES.EMPLOYEE] },
  {
    text: "Positions",
    href: "/Positions",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
];

export default function Header() {
  const { currentUser, setCurrentUser } = useAuth();
  const userRole = currentUser ? currentUser.role : null;

  const availableLinks = HEADER_LINKS.filter((link) =>
    link.roles.includes(userRole)
  );

  return (
    <div className="bg-rit-orange p-4 flex flex-row">
      <div id="Logo" className="text-left pl-10">
        <h1 className="text-4xl font-bold">Course Assistant Portal</h1>
        <h3>Department of Software Engineering, RIT </h3>
      </div>
      <nav className="pb-2 mt-2 text-white text-lg text-right flex-grow space-x-4 pr-10">
        {availableLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.text}
          </Link>
        ))}
      </nav>
    </div>
  );
}
