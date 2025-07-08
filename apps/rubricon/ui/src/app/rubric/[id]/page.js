import Rubric from "@/components/Rubric";
import { server_url } from "@/consts";
import Link from "next/link";

export default async function RubricPage({ params }) {
    const { id } = await params;

    const res = await fetch(`${server_url}/rubrics/${id}`, {
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
                    <Link href={"/rubrics"} className="text-xl hover:text-black mr-auto">{"Back"}</Link>
                    <h1 className="text-4xl mx-auto">Create a Rubric</h1>
                    <Link href={`/edit/${id}`} className="text-xl hover:text-black ml-auto">{"Edit"}</Link>
                </div>
            <Rubric data={data} />
        </div>
    );
}
