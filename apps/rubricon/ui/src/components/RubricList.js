import Link from "next/link";

function RubricListItem({ data }) {
    return (
        <Link href={"/rubric/" + data.id} className="border rounded-md p-2">
            <h3 className="font-bold">{data.title}</h3>
            <p>{data.description}</p>
        </Link>
    );
}

export default async function RubricList() {
    const response = await fetch("http://localhost:5000/rubrics");
    const rubrics = await response.json();

    return (
        <div className="flex flex-col gap-4 w-4/5 mx-auto border rounded-lg p-4">
            <>
                {
                    rubrics.length === 0 ? (
                        <>
                            No Rubrics Found
                        </>
                    ) : (
                        <>
                            {
                                rubrics.map((rubric, index) => (
                                    <RubricListItem key={index} data={rubric} />
                                ))
                            }
                        </>
                    )
                }
            </>
        </div>
    );
}