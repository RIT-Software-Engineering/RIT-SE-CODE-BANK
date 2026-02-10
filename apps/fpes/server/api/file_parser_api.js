const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const extracted = {
        name: extractField(lines, 'Name'),
        rank: extractField(lines, 'Rank'),
        unit: extractField(lines, 'Unit'),
        affiliations: extractField(lines, 'Affiliations'),
        period: extractField(lines, 'Period'),
        scholarship: extractSection(text, 'Scholarship', 'Teaching'),
        teaching: extractSection(text, 'Teaching', 'Service'),
        service: extractSection(text, 'Service', 'Professional Development'),
        administrative: extractSection(text, 'Administrative Responsibilities/Releases')
    };
    
    return extracted;
}

function extractField(lines, fieldName) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(fieldName)) {
            return lines[i + 1] || '';
        }
    }
    return '';
}

function extractSection(text, startMarker, endMarker) {
    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) return '';
    
    const endIdx = endMarker ? text.indexOf(endMarker, startIdx) : text.length;
    return text.substring(startIdx + startMarker.length, endIdx).trim();
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
