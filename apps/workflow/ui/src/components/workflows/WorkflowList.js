'use server';

import Link from "next/link";

async function WorkflowListItem({ workflow }) {
    return (
        <Link
            href={"/dashboard/workflow/" + workflow.id}
        >
            <div className="flow flow-col gap-2 border border-solid border-black rounded-md p-2">
                <h2 className="text-lg font-bold">{"Name: " + workflow.base_action.name}</h2>
                <p>{"Description: " + workflow.base_action.description}</p>
            </div>
        </Link>
    )
}

export default async function WorkflowList({ searchParams }) {
    let queryParams = "";
    if (searchParams) {
        // use a "?" for the first query param
        queryParams += "?"
        let firstParam = true;

        Object.keys(searchParams).forEach(key => {
            // use an "&" for subsequent query params
            if (!firstParam) {
                queryParams = "&"
            } else {
                firstParam = false;
            }

            const value = searchParams[key];
            queryParams += `${key}=${value}`;
        });
    }

    const data = await fetch("http://localhost:3001/workflows" + queryParams, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const workflows = await data.json();

    return (
        <div className="flex flex-col gap-2">
            {workflows.map((workflow) => (
                <WorkflowListItem key={workflow.id} workflow={workflow} />
            ))}
        </div>
    )
}