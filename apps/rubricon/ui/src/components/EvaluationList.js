import Link from "next/link";

function EvaluationListItem({ data }) {
    return (
        <Link href={"/evaluation/" + data.id} className="border rounded-md p-2">
            <h3 className="font-bold">{data.title}</h3>
            <p>{data.message}</p>
        </Link>
    );
}

export default async function EvaluationList() {
    const response = await fetch("http://localhost:5000/evaluations");
    const evaluations = await response.json();

    return (
        <div className="flex flex-col gap-4 w-4/5 mx-auto border rounded-lg p-4">
            <>
                {
                    evaluations.length === 0 ? (
                        <>
                            No Evaluations Found
                        </>
                    ) : (
                        <>
                            {
                                evaluations.map((evaluation, index) => (
                                    <EvaluationListItem key={index} data={evaluation} />
                                ))
                            }
                        </>
                    )
                }
            </>
        </div>
    );
}