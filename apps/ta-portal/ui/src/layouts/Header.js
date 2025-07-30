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
  {
    text: "Applications",
    href: "/Applications/Candidate/[uid]",
    roles: [ROLES.CANDIDATE],
  },
  {
    text: "Applications",
    href: "/Applications/Employer/[uid]",
    roles: [ROLES.EMPLOYER],
  },
  {
    text: "Applications",
    href: "/Applications/Employee/[uid]",
    roles: [ROLES.EMPLOYEE],
  },
  {
    text: "Profile",
    href: "/Profile",
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.EMPLOYER],
  },
];

export default function Header() {
  const { currentUser } = useAuth();
  const userRole = currentUser ? currentUser.role : null;

  const availableLinks = HEADER_LINKS.filter((link) =>
    link.roles.includes(userRole)
  );

  return (
    <div className="bg-rit-orange p-4 flex flex-row">
      <div id="Logo" className="text-left pl-10">
        <h1 className="text-4xl font-bold">Teaching Assistant Portal</h1>
        <h3>Department of Software Engineering, RIT </h3>
      </div>
      <nav className="pb-2 mt-2 text-white text-lg text-right flex-grow space-x-4 pr-10">
         {availableLinks.map((link) => {
          const finalHref = link.href.includes("[uid]") && currentUser
              ? link.href.replace("[uid]", currentUser.uid)
              : link.href;

          return (
            <Link key={finalHref} href={finalHref}>
              {link.text}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
