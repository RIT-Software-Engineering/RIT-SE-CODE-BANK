import Rubric from "@/components/Rubric";

export default async function RubricPage({ params }) {
    const { id } = params;
    const response = await fetch("http://localhost:5000/rubrics/" + id);
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