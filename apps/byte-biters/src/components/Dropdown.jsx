import Button from "./Button";
import { useState } from "react"

//dropdown featurn for the side panel
export default function Dropdown({name}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="bg-main-secondary ">
            <Button className="text-lg p-4 border-border-primary border-b-2 w-full text-left"  onClick={() => setIsOpen(!isOpen)}>{name}</Button>
        
        {isOpen && (
        <div className="bg-gray-700 p-3 border-border-primary border-b-2 ">
          test content
        </div>
      )}
        </div>
    )
}