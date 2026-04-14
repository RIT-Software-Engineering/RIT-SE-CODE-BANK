import React from "react";
import Button from "./Button";

//component that handles when a user exports a file from the code editor
export default function FileExporter ({code}){

    //when the Export File button is clicked, it prompts the user to choose a file
    const handleExport = () => {
        //basecase for empty code editor
        if (!code) {
            alert("No code to export");
            return;
        }

        //ask the user for a file name, pdp11program.txt by default
        const filename = prompt("Enter file name:", "pdp11program.txt");
        if (!filename) return;

        // create file from code
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        // create temporary download link
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        // cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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