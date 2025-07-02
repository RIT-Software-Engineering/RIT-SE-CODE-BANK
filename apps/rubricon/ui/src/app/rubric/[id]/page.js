import Rubric from "@/components/Rubric";
import { server_url } from "@/consts";

export default async function RubricPage({ params }) {
    const { id } = await params;

    const res = await fetch(`${server_url}/rubrics/${id}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log(data);
    return <Rubric data={data} />;
}
