import Rubric from "@/components/Rubric";
import { server_url } from "@/consts";
import Link from "next/link";

export default async function RubricPage({ params }) {
    const { rubricId } = await params;

    const res = await fetch(`${server_url}/rubrics/${rubricId}`, {
        method: 'GET',
        headers: { Accept: "application/json" }
    });

    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="grid grid-cols-3 items-center p-4 w-full text-white font-bold bg-primary">
                <div className="flex flex-row justify-start items-center gap-2">
                    <Link href={"/rubrics"} className="text-xl hover:text-black">Back</Link>
                </div>
                <h1 className="text-4xl mx-auto">Rubric</h1>
                <div className="flex flex-row justify-end items-center gap-2">
                    <Link href={`/rubrics/${rubricId}/evaluations`} className="text-xl hover:text-black">Evaluations</Link>
                    <Link href={`/rubrics/${rubricId}/edit`} className="text-xl hover:text-black">Edit</Link>
                </div>
            </div>
            <Rubric data={data} />
        </div>
    );
}
