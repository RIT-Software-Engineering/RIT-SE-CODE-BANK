'use server';

import Link from "next/link";

async function WorkflowListItem({ workflow }) {

    // Name and Description should be defined for every action.
    const nameData = await fetch("http://localhost:3001/metadata?key=Name&actionId=" + workflow.base_action.id, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const name = (await nameData.json())[0];
    const descriptionData = await fetch("http://localhost:3001/metadata?key=Description&actionId=" + workflow.base_action.id, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const description = (await descriptionData.json())[0];

    return (
        <Link
            href={"/dashboard/workflow/" + workflow.id}
        >
            <div className="flow flow-col gap-2 border border-solid border-black rounded-md p-2">
                <h2 className="text-lg font-bold">{"Name: " + name.value}</h2>
                <p>{"Description: " + description.value}</p>
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