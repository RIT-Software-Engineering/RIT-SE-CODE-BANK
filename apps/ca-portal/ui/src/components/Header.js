// src/components/Header.js

import Link from 'next/link';
export default function Header() {
  return (
    // Add childen prop to allow passing components inside header eg links
    <div className="bg-rit-orange p-4 flex flex-row">
      <div id="Logo" className="text-left pl-10">
        <h1 className="text-4xl font-bold">Course Assistant Portal</h1>
        <h3>Department of software engineering, RIT </h3>
      </div>
      <nav className="pb-2 mt-2 text-white text-lg text-right flex-grow space-x-4 pr-10">
        <Link href="/">Home</Link>
        <Link href="/Users">Users</Link>
        <Link href="/Messaging">Messaging</Link>
        <Link href="/Timecard">Timecard</Link>
      </nav>
    </div>
  );
}
