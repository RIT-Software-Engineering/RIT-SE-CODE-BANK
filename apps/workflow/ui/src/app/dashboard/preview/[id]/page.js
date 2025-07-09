'use client';

import Link from "next/link";
import ActionState from "@/components/actions/ActionState"
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function PreviewPage() {
    const params = useParams();
    const { id } = params;
    const url = "http://localhost:3001";

    const [workflow, setWorkflow] = useState(null)
    const [action, setAction] = useState(null);

    useEffect(() => {
        fetch(`${url}/workflows/${id}`, {
            method: 'GET'
        }).then((res) => {
            return res.json();
        }).then((workflow) => {
            setWorkflow(workflow);
            setAction(workflow.root_action)
        });
    }, [url, id]);

    return (
        <>
            <div className="grid grid-cols-3 items-center justify-between border-b py-2 mb-4">
                <div className="flex flex-row gap-2 items-center justify-start h-full pl-4">
                    <Link href={"/dashboard/workflow/" + id} className="border p-2 rounded-sm min-w-24 text-center hover:bg-red-600 hover:text-white">Exit</Link>
                </div>
                <h1 className="text-4xl font-bold w-fit mx-auto text-center">Preview {workflow?.base_action?.name}</h1>
                <div className="flex flex-row gap-2 items-center justify-end h-full pr-4">
                </div>
            </div>
            <div>
                <ActionState action={action} setAction={setAction} />
            </div>
        </>
    )
}