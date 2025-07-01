import Rubric from "@/components/Rubric";
import { server_url } from "@/consts";

export default async function RubricPage({ params }) {
    const { id } = await params;

    const response = await fetch(server_url + "/rubrics/" + id);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    const data = await response.json();

    return (
        !data ? (
            <p>No data!</p>
        ) : (
            <Rubric data={data} />
            
        )

    );
}