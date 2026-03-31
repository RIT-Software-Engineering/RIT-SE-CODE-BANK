import React, { useRef, useState } from "react";
import Button from "./Button";

export default function FileUploader ({setCode, onUploadComplete}){
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    function handleFileChange(e) {
        const file = e.target.files[0];

        if (file){
            if (!file.name.endsWith(".txt")){
                alert("Please upload a .txt file");
                return;
            }
            setFile(file);
        }
        
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target.result;
            setCode(text);
            if (onUploadComplete) {
                onUploadComplete();
            }
        };

        reader.readAsText(file);
        };
    
    return (
        <div>
            <Button onClick={handleButtonClick} className="absolute top-full bg-main-secondary py-3 px-2 border-b-2 border-border-primary rounded shadow-lg z-10 w-40">
                Upload File</Button>

            <input type="file" accept=".txt,.asm" ref={fileInputRef}  onChange={handleFileChange} className="hidden"/>
        </div>
    )
}