import WorkflowList from "@/components/workflows/WorkflowList";

export default async function WorkflowsPage() {
    // const data = await fetch(process.env.SERVER_URL)    
    return (
        <>
            This is the workflows page, where you can view all of the workflows that you have access to.
            You can use this to navigate between specific workflows.
            <div className="w-4/5 m-auto p-4">
                <h1 className="text-2xl font-bold">My Workflows</h1>
                <div className="border border-solid border-black rounded-xl p-4 mx-[-16]">
                <WorkflowList /> {/* TODO: Wrap this in a suspense, replace with a skeleton while loading */}
            </div>
            </div>
        </>
    )
}