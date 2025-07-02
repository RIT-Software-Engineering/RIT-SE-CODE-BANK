import Link from "next/link";

export default function DashboardPage() {
    return (
        <>
            <div className="flex flex-col items-center justify-center gap-4 mb-[5vh] min-h-[50vh] bg-primary">
                <h1 className="text-white text-4xl font-bold">Dashboard</h1>
                <div className="flex flex-row items-center justify-between gap-[2vw] w-4/5">
                    <Link href="/create" className="flex items-center justify-center w-[25vw] h-[25vh] p-2 bg-white rounded-2xl font-bold hover:bg-light-gray">Create New Rubric</Link>
                    <Link href="/" className="flex items-center justify-center w-[25vw] h-[25vh] p-2 bg-white rounded-2xl font-bold hover:bg-light-gray">Button 2...</Link>
                    <Link href="/" className="flex items-center justify-center w-[25vw] h-[25vh] p-2 bg-white rounded-2xl font-bold hover:bg-light-gray">Button 3...</Link>
                </div>
            </div>
        </>
    );
}