'use server'

export default async function ActionPage({ params }) {
    const { id } = await params;
    const url = process.env.SERVER_URL || ""
    const data = await fetch(url + "/actions?actionId=" + id,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    const action = (await data.json())[0];

    return (
        <>
            <h1 className="text-5xl font-bold w-fit mt-4 mx-auto">Action</h1>
            <div className="flex flex-col gap-4 my-4 w-4/5 m-auto border rounded-xl p-4">
                <div>
                    <h2 className="text-2xl font-bold">Metadata</h2>
                    <div className="flex flex-col gap-2 border border-solid border-black rounded-xl p-2">
                        {(action.metadata).map((data) => (
                            <div key={data.id} className="border border-solid border-black rounded-md p-2">
                                {data.key + ": " + data.value}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Attributes</h2>
                    <div className="flex flex-col gap-2 border border-solid border-black rounded-xl p-2">
                        <div>{"Type: " + action.action_type}</div>
                        <div>{"Frozen: " + action.is_frozen}</div>
                    </div>
                </div>
            </div>
        </>
    )
}