import Button from "./Button";
import { useState } from "react"

export default function Dropdown({name}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="bg-pink-900">
            <Button className="text-lg p-4" onClick={() => setIsOpen(!isOpen)}>{name}</Button>
        
        {isOpen && (
        <div className="bg-gray-700 p-3">
          test content
        </div>
      )}
        </div>
    )
}