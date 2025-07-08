'use client';

import { useEffect, useState } from "react";
import { server_url } from "@/consts";

function Template({ template, selectedTemplateId, selectTemplate }) {
    return (
        <button
            className={"border rounded-md p-4 hover:bg-light-gray" + (selectedTemplateId === template.id ? " bg-primary" : "")}
            onClick={() => selectTemplate(template.id)}
        >
            <h2 className="text-lg font-bold text-center">{template.rubric.title}</h2>
            <p className="text-md">{template.rubric.description}</p>
        </button>
    );
}

export default function TemplateSelector({ selectedTemplateId, selectTemplate }) {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        fetch(server_url + "/templates")
            .then(res => res.json())
            .then(data => setTemplates(data));
    }, []);

    return (
        <div className="flex flex-col gap-4 w-8/10 mx-auto">
            <h2 className="mx-auto text-2xl">Choose a template</h2>
            <div className="grid grid-cols-3 gap-4">
                {templates.map((template, index) => (
                    <Template
                        key={index}
                        template={template}
                        selectedTemplateId={selectedTemplateId}
                        selectTemplate={selectTemplate}
                    />
                ))}
            </div>
        </div>
    );
}
