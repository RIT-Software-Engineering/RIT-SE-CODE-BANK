const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const key = process.env.GEMINI_KEY
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

async function parseGrantAI(scholarship_section) {
    const prompt = `
    You are a data extraction assistant to extract the following fields from the text below.

    Fields:
    - title (project name)
    - funder (agency that is funding the grant)
    - amount (number only)
    - period (date range)
    - role 
    - share (%)
    - url
    - progress (funded, submitted, declined, in development)
    - additional comments 
    
    Input Text:
    "${scholarship_section}"
    
    Output Format:
    Return ONLY a raw JSON object. Do not wrap it in markdown (no \`\`\`json tags).
    If a field is not found, set it to null.) 
    `;

        // Expected JSON output list of
        //     {
        //     title: '',
        //     funder: '',
        //     amount: '',
        //     period: '',
        //     role: '',
        //     share: '',
        //     url: '',
        //     progress: '',
        //     additional_comments: ''
        // }


    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;

        let text = response.text();

        const data = JSON.parse(text);
        console.log(data)
        return data;
    } catch (error) {
        console.error("Error parsing grant: ", error);
        return null;
    }
}

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text;
    // console.log('=== Start PDF TEXT ===');
    // console.log(text);
    // console.log('=== END PDF TEXT ===');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const scholarship = extractSection(text, 'Scholarship', 'Teaching');

    const [scholarshipData] = await Promise.all([
        parseGrantAI(scholarship)
    ]);
    


    const extracted = {
        name: extractField(lines, 'Name'),
        rank: extractField(lines, 'Rank'),
        unit: extractField(lines, 'Unit(s)') || extractField(lines, 'Unit'),
        affiliations: extractField(lines, 'Affiliations'),
        period: extractField(lines, 'Period'),
        scholarship: scholarshipData,
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
