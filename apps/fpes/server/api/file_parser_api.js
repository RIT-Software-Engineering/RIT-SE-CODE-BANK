const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text;
    // console.log('=== Start PDF TEXT ===');
    // console.log(text);
    // console.log('=== END PDF TEXT ===');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const extracted = {
        name: extractField(lines, 'Name'),
        rank: extractField(lines, 'Rank'),
        unit: extractField(lines, 'Unit(s)') || extractField(lines, 'Unit'),
        affiliations: extractField(lines, 'Affiliations'),
        period: extractField(lines, 'Period'),
        scholarship: extractSection(text, 'Scholarship', 'Teaching'),
        teaching: extractSection(text, 'Teaching', 'Service'),
        service: extractSection(text, 'Service', 'Professional Development'),
        administrative: extractSection(text, 'Administrative', null)
    };
    
    console.log('=== EXTRACTED DATA ===');
    console.log(JSON.stringify(extracted, null, 2));
    
    return extracted;
}

function extractField(lines, fieldName) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(fieldName + ' ')) {
            return lines[i].substring(fieldName.length + 1).trim();
        }
        if (lines[i] === fieldName && i + 1 < lines.length) {
            return lines[i + 1];
        }
    }
    return '';
}

function extractSection(text, startMarker, endMarker) {
    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) {
        console.log(`Section "${startMarker}" not found`);
        return '';
    }
    
    let endIdx;
    if (endMarker) {
        endIdx = text.indexOf(endMarker, startIdx + startMarker.length);
        if (endIdx === -1) endIdx = text.length;
    } else {
        endIdx = text.length;
    }
    
    const extracted = text.substring(startIdx + startMarker.length, endIdx).trim();
    console.log(`Extracted "${startMarker}": ${extracted.substring(0, 100)}...`);
    return extracted;
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
