import React, { useRef, useState } from "react";
import Button from "./Button";

//component that handles when a user uploads a file to the code editor
export default function FileUploader ({setCode, onUploadComplete}){
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);

    //when the Open File button is clicked, it prompts the user to choose a file
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    //grabs the file and changes the code editor to its contents
    function handleFileChange(e) {
        const file = e.target.files[0];

        if (file){
            //safety net in case the file is not a text file
            if (!file.name.endsWith(".txt")){
                alert("Please upload a .txt file");
                return;
            }
            setFile(file);
        }
        
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target.result;
            //this is where the text is sent to the code editor
            setCode(text);
            //for closing the dropdown
            if (onUploadComplete) {
                onUploadComplete();
            }
        };

        reader.readAsText(file);
        };
    
    return (
        <div>
            {/* dropdown button named open file */}
            <Button onClick={handleButtonClick} className="absolute top-full bg-main-secondary py-3 px-2 border-b-2 border-border-primary rounded shadow-lg z-10 w-40">
                Open File</Button>

            {/* actual functionality */}
            <input type="file" accept=".txt" ref={fileInputRef}  onChange={handleFileChange} className="hidden"/>
        </div>
    )
}