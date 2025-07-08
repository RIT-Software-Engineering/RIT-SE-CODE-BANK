'use client';

import Link from "next/link";
import TemplateSelector from "@/components/TemplateSelect";
import RubricEditor from "@/components/RubricEditor";
import { useState } from "react";
import { server_url } from "@/consts";

export default function CreatePage() {
    const [templateId, setTemplateId] = useState(null);
    const [data, setData] = useState(null);

    async function setTemplate(templateId) {
        setTemplateId(templateId);
        const res = await fetch(`${server_url}/templates/${templateId}`, {
            method: 'GET'
        });
        const template = await res.json();
        setData(template.rubric);
    }

    async function handleSave() {
        await fetch(`${server_url}/rubrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(window.location.href = "/rubrics");
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="grid grid-cols-3 items-center p-4 w-full text-white font-bold bg-primary">
                    <Link href={"/rubrics"} className="text-xl hover:text-black mr-auto">{"Cancel"}</Link>
                    <h1 className="text-4xl mx-auto">Choose a template</h1>
                    <button onClick={handleSave} className="text-xl hover:text-black ml-auto">{"Save"}</button>
                </div>
                {!data && <TemplateSelector selectedTemplateId={templateId} selectTemplate={setTemplate} />}
                {data && <RubricEditor data={data} setData={setData} />}
            </div>
        </>
    )
}