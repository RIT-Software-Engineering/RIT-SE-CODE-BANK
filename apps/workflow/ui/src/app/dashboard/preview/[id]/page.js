import Link from "next/link";
import ActionState from "@/components/actions/ActionState"

export default async function PreviewPage({ params }) {
    const { id } = await params;
    const url = process.env.SERVER_URL || "http://localhost:3001";
    const data = await fetch(url + "/workflows?workflowId=" + id,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    const workflow = (await data.json())[0];
    console.log(workflow);

    return (
        <>
            <div className="grid grid-cols-3 items-center justify-between border-b py-2 mb-4">
                <div className="flex flex-row gap-2 items-center justify-start h-full pl-4">
                    <Link href={"/dashboard/workflow/" + id} className="border p-2 rounded-sm min-w-24 text-center hover:bg-red-600 hover:text-white">Exit</Link>
                </div>
                <h1 className="text-5xl font-bold w-fit mx-auto text-center">Preview</h1>
                <div className="flex flex-row gap-2 items-center justify-end h-full pr-4">
                </div>
            </div>
            <div>
                <ActionState actionId={workflow.root_action_id} />
            </div>
        </>
    )
}