//Takes in the users code to get each line and cleans it
export function index(input) {
    const lines = input.split("\n");
    const updatedLines = [];

    for(let i = 0; i < lines.length; i++) {
        const updatedLine = lines[i].replace(/\s+/g,' ').replace(/ *, */g, ", ").split(";")[0].trim();
        if(updatedLine != ""){
            updatedLines.push(updatedLine);
        }
    }
    return updatedLines;
}