import { Button } from "@mui/material";
import Link from "next/link";

export default function Home() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">Peer Eval</h1>
                <p className="text-xl mb-8">Empower Every Voice.</p>
                <Link href="/dashboard">
                    <Button variant="outlined">Start</Button>
                </Link>
            </div>
        </main>
    );
}
