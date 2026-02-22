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
    Return ONLY a raw JSON array of objects, one for each grant/project found. Do not wrap it in markdown (no \`\`\`json tags).
    If a field is not found, set it to null.
    If no grants are found, return an empty array [].
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
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error parsing grant: ", error);
        return [];
    }
}

async function parseServiceHoursAI(service_section) {
    const prompt = `
    Extract all service hours mentioned in the text and return ONLY the total sum as a number.
    Look for patterns like "80 hrs", "40 hrs.", "5 hours", "10 hours in total", etc.
    Add them all up and return just the number.
    
    Input Text:
    "${service_section}"
    
    Output Format:
    Return ONLY a number (the total hours). If no hours found, return 0.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const hours = parseInt(text);

        return hours || null;
    } catch (error) {
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
    


    const serviceSection = extractSection(text, 'Service', 'Professional Development');
    const serviceHours = await parseServiceHoursAI(serviceSection);

    const extracted = {
        name: extractField(lines, 'Name'),
        rank: extractField(lines, 'Rank'),
        unit: extractField(lines, 'Unit(s)') || extractField(lines, 'Unit'),
        affiliations: extractField(lines, 'Affiliations'),
        period: extractField(lines, 'Period'),
        scholarship: scholarshipData,
        teaching: extractSection(text, 'Teaching', 'Service'),
        service: serviceSection,
        service_hours: serviceHours,
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
