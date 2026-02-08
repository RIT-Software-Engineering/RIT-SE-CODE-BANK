const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // Extract text and parse into structured data
    const lines = data.text.split('\n').filter(line => line.trim());
    const results = [];
    
    // parsing logic adjust based on PDF structure
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for lines that might contain evaluation data
        if (line.includes('Question') || line.match(/\d+\.\d+/)) {
            results.push(line);
        }
    }
    
    return { raw: data.text, parsed: results };
}

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

module.exports = { parsePDF, parseCSV };
