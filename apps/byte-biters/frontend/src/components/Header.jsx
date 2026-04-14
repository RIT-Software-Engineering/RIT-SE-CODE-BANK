import Button from "./Button";
import FileExporter from "./FileExporter";
import FileUploader from "./FileUploader";
import { useState } from "react"

//header, includes the file and external resources buttons/links
export default function Header({code, setCode}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div>
        <div className="p-6 flex bg-main-primary min-h-20 justify-between">
            <div className="relative ">
                {/* file button on the top left of the page, opens a dropdown */}
                <Button className="font-mono text-text-muted text-lg text-center px-2" onClick={() => setIsOpen(!isOpen)}>File</Button>
                {isOpen && (
                    // refer to FileUploader component
                    <div className="absolute top-full left-0 flex flex-col bg-main-secondary shadow-lg z-50">
                    <FileUploader setCode={setCode} onUploadComplete={() => setIsOpen(false)} ></FileUploader>
                    <FileExporter code={code} onUploadComplete={() => setIsOpen(false)}></FileExporter>
                    </div>
                )}
            </div>
            {/* external resources button on the top right of the page, has no current functionality */}
            <Button className="font-mono text-text-muted text-lg"> External Resources</Button>
        </div>
        
        <div className="bg-border-primary min-h-4"></div>
        </div>
    )

}