import React, { useRef, useState } from "react";

export default function FileUploader ({setCode}){
    const [file, setFile] = useState(null);

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
        };

        reader.readAsText(file);
        };
    
    return (
        <div>
            <input type="file" accept=".txt" onChange={handleFileChange}/>
        </div>
    )
}