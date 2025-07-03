'use server'

import ActionList from "@/components/actions/ActionList";
import Link from "next/link";

export default async function WorkflowPage({ params }) {
    const { id } = await params;
    const url = process.env.SERVER_URL || ""
    const data = await fetch(url + "/workflows?workflowId=" + id,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    const workflow = (await data.json())[0];

    return (
        <>
            <div className="grid grid-cols-3 items-center justify-between border-b py-2 mb-4">
                <div className="flex flex-row gap-2 items-center justify-start h-full pl-4">
                    {/* <Link href={"/"} className="border p-2 rounded-sm min-w-24 text-center">Other</Link> */}
                </div>
                <h1 className="text-5xl font-bold w-fit mx-auto text-center">Workflow</h1>
                <div className="flex flex-row gap-2 items-center justify-end h-full pr-4">
                    <Link href={"/dashboard/preview/" + id} className="border p-2 rounded-sm min-w-24 text-center">Preview</Link>
                </div>
            </div>
            <div className="flex flex-col gap-4 my-4 w-4/5 m-auto border rounded-xl p-4">
                <div>
                    <h2 className="text-2xl font-bold">Metadata</h2>
                    <div className="flex flex-col gap-2 border border-solid border-black rounded-xl p-2">
                        {(workflow.base_action.metadata).map((data) => (
                            <div key={data.id} className="border border-solid border-black rounded-md p-2">
                                {data.key + ": " + data.value}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Attributes</h2>
                    <div className="flex flex-col gap-2 border border-solid border-black rounded-xl p-2">
                        <div>{"Type: " + workflow.base_action.action_type}</div>
                        <div>{"Frozen: " + workflow.base_action.is_frozen}</div>
                    </div>
                </div>
            </div>
            <div className="w-4/5 m-auto p-4">
                <h2 className="text-2xl font-bold">Actions</h2>
                <div className="border border-solid border-black rounded-xl p-4 mx-[-16]">
                    <ActionList searchParams={{"workflowId": workflow.id}}/>
                </div>
            </div>
        </>
    )
}