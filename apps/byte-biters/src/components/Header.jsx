import Button from "./Button";
import { useState } from "react"

//header, includes the add file and external resources buttons/links
export default function Header() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div>
        <div className="p-6 flex bg-main-primary min-h-20 justify-between">
            <div className="relative ">
                <Button className="font-mono text-text-muted text-lg text-center px-2" onClick={() => setIsOpen(!isOpen)}>Add File! +</Button>
                {isOpen && (
                    <div className="absolute top-full bg-main-secondary py-3 px-2 border-b-2 border-border-primary rounded shadow-lg z-10 w-40">
                    Add File
                    </div>
                )}
            </div>
            <Button className="font-mono text-text-muted text-lg"> External Resources</Button>
        </div>
        
        <div className="bg-border-primary min-h-4"></div>
        </div>
    )

}