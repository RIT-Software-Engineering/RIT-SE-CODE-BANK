/**
 * Component Showcase Homepage
 * 
 * Entry point for the RIT shared component demonstration application.
 * 
 * Provides access to the existing TeamBuilder component showcase
 * and the PeerEval component showcase.
 * 
 * Each application's components are demonstrated independently 
 * through their respective showcase pages.
 */
import  DemoPage  from "./implementation/page";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="font-semibold">
          COMPS Demo App
        </h1>
        <Link href="/peereval" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Explore PeerEval Components
        </Link>
      </div>

      <div className="p-4">
        <h2 className="mb-4 text-xl font-semibold">
          TeamBuilder Components
        </h2>

        <DemoPage />
      </div>
    </main>
  );
}
