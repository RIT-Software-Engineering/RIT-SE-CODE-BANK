'use client';

import Link from "next/link";
import RubricEditor from "@/components/RubricEditor";
import { useState, useEffect } from "react";
import { server_url } from "@/consts";
import { useParams } from "next/navigation";

export default function EditPage() {
    const params = useParams();
    const { rubricId } = params;

    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchRubric = async () => {
            try {
                const res = await fetch(`${server_url}/rubrics/${rubricId}`, {
                    method: 'GET',
                    headers: { Accept: "application/json" }
                })
                const rubric = await res.json();
                setData(rubric);
            } catch (error) {
                console.error("Failed to fetch rubrics:", error);
            }
        };

        fetchRubric();
    }, [server_url, rubricId]);

    async function handleSave() {
        await fetch(`${server_url}/rubrics/${rubricId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(window.location.href = `/rubrics/${rubricId}`);
    }

    async function handleDelete() {
        const confirmed = window.confirm("Are you sure you want to delete this rubric?")
        if (confirmed) {
            await fetch(`${server_url}/rubrics/${rubricId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(window.location.href = `/rubrics`);
        }
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="grid grid-cols-3 items-center p-4 w-full text-white font-bold bg-primary">
                    <Link href={`/rubrics/${rubricId}`} className="text-xl hover:text-black mr-auto">{"Cancel"}</Link>
                    <h1 className="text-4xl mx-auto">Create a Rubric</h1>
                    <button onClick={handleSave} className="text-xl hover:text-black ml-auto">{"Save"}</button>
                </div>
                <div className="flex flex-col align-right w-4/5 m-auto">
                    <button onClick={handleDelete} className="text-xl text-red-600 bg-white hover:text-white hover:bg-red-600 border rounded-md my-2 p-2 ml-auto">Delete</button>
                </div>
                {data && <RubricEditor data={data} setData={setData} />}
            </div>
        </>
    )
}