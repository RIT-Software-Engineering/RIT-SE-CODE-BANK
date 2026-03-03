//Takes in the users code to get each line and cleans it
function index(input) {
    const lines = input.split("\n");
    const updatedLines = [];

    for(let i = 0; i < lines.length; i++) {
        const updatedLine = lines[i].replace(/\s+/g,' ').replace(/ *, */g, ", ").split(";")[0].trim();
        if(updatedLine != ""){
            updatedLines.push(updatedLine);
        }
    }
    // console.log(updatedLines[0]);
    return updatedLines;
}


// index("   MOV R1     , R2      ; move R1 into R2\nADD   #5, R3\n\n    ; a full-line comment\nSUB (R2)+, R4   ; subtract");