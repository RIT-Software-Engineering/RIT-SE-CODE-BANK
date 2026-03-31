import Button from "./Button";
import FileUploader from "./FileUploader";
import { useState } from "react"

//header, includes the add file and external resources buttons/links
export default function Header({setCode}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div>
        <div className="p-6 flex bg-main-primary min-h-20 justify-between">
            <div className="relative ">
                <Button className="font-mono text-text-muted text-lg text-center px-2" onClick={() => setIsOpen(!isOpen)}>Add File! +</Button>
                {isOpen && (
                    <FileUploader setCode={setCode} onUploadComplete={() => setIsOpen(false)} ></FileUploader>
                )}
            </div>
            <Button className="font-mono text-text-muted text-lg"> External Resources</Button>
        </div>
        
        <div className="bg-border-primary min-h-4"></div>
        </div>
    )

}