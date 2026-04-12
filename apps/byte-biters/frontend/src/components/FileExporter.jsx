import React from "react";
import Button from "./Button";

//component that handles when a user exports a file from the code editor
export default function FileExporter ({code}){

    //when the Export File button is clicked, it prompts the user to choose a file
    const handleExport = () => {
        
    };

    return (
        <div>
            {/* dropdown button named export file */}
            <Button
            onClick={handleExport}
            className="absolute top-full bg-main-secondary py-3 px-2 border-b-2 border-border-primary rounded shadow-lg z-10 w-40">
            Export File
            </Button>
        </div>
    )
}