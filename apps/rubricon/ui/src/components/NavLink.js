'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, active = "", className, children }) {
    const pathname = usePathname(); // Get current pathname

    const isActive = pathname === href; // Check if link is active

    let fullClassName = className;
    if (isActive) {
        fullClassName += " " + active;
    }

    return (
        <Link href={href} className={fullClassName}>
            {children}
        </Link>
    );
}