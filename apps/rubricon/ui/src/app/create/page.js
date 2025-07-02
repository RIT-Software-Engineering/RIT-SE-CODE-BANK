'use client';

import Link from "next/link";
import TemplateSelector from "@/components/TemplateSelect";
import { useState } from "react";

export default function CreatePage() {
    const [template, setTemplate] = useState(null)

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex flex-row items-center justify-between p-4 w-full text-white font-bold  bg-primary">
                    <Link href={"/dashboard"} className="text-xl hover:text-black">{"< Back"}</Link>
                    <h1 className="text-4xl">Choose a template</h1>
                    <Link href={""} className="text-xl hover:text-black">{"Next >"}</Link>
                </div>
                <TemplateSelector selectedTemplateId={template} selectTemplate={setTemplate}/>
            </div>
        </>
    )
}