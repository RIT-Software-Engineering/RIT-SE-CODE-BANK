/**
 * Takes in the raw user assembly code and cleans up the line spacing.
 * Removes any extra whitespace and empty lines and ignores comments.
 * @param {string} input The raw user assembly code.
 * @return {string[]} A list of the individual lines of code.
 */
export function preProcess(input) {
    const lines = input.split("\n");
    const updatedLines = [];

    for(let i = 0; i < lines.length; i++) {
        const updatedLine = lines[i].replace(/\s+/g,' ').replace(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g, ", ").split(";")[0].trim();
        if(updatedLine != ""){
            updatedLines.push(updatedLine);
        }
    }
    return updatedLines;
}