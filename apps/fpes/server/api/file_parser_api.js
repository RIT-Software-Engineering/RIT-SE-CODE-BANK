const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const key = process.env.GEMINI_KEY
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview"});
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});


async function parseGrantAI(scholarship_section) {
    // console.log(scholarship_section)
    const prompt = `
    You are a data extraction assistant to extract the following fields from the text below.

    Fields:
    - title (project name)
    - funder (agency that is funding the grant)
    - amount (number only)
    - start_date (YYYY-MM-DD format, or null if not found)
    - end_date (YYYY-MM-DD format, or null if not found)
    - faculty_role (the person's role in the grant)
    - faculty_share (percentage of funding)
    - url
    - grant_status (funded, submitted, declined, in development)
    - comments 
    
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
        //     start_date: '',
        //     end_date: '',
        //     faculty_role: '',
        //     faculty_share: '',
        //     url: '',
        //     grant_status: '',
        //     comments: ''
        // }


    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;

        let text = response.text();

        const data = cleanAIResponse(text);
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

async function parsePublicationAI(publications_lines) {
    const prompt = `
        Extract publication details from the provided text into a JSON array of objects.

        Fields to extract for each entry:
        - "title": The title of the publication, patent, or creative work.
        - "authors": An array of author names as strings.
        - "type": The publication type, venue classification, or patent info typically found at the very end of the entry (e.g., "US Patent", "CORE A* journal", "CORE B conf.", or the conference/journal name if CORE is not specified). If missing, set to null.

        CRITICAL INSTRUCTIONS FOR OUTPUT:
        1. Output strictly valid JSON.
        2. Start your response directly with the '[' character and end with the ']' character.
        3. Absolutely NO markdown formatting, NO \`\`\`json blocks, and NO conversational text.

        Input Text:
        "${publications_lines}"
        `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;

        let text = response.text();

        const data = cleanAIResponse(text);
        console.log(data)
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error parsing publication: ", error);
        return [];
    }

}

function cleanAIResponse(response) {
    try {
        return JSON.parse(response);
    } catch (error) {
        const cleanedText = response
            .replace(/^```(json)?\s*/i, '') // Removes leading ``` or ```json
            .replace(/\s*```$/i, '')        // Removes trailing ```
            .trim();
            
        return JSON.parse(cleanedText);
    }
}
// current cell info:
// {
//     str_agree: '93%',
//     agree: '7%',
//     neutral: '0%',
//     disagree: '0%',
//     str_disagree: '0%',
//     uni_avg: '4.20',
//     col_avg: '4.15',
//     swen_avg: '4.07',
//     avg: '4.93',
//     top_two: '100%',
//     n: '14',
//     question: 'Instructor was effective',
//     question_number: '12'
//   }



// gets the whole table
function parseTeachEvalTable(text){
    let raw_table = extractSection(text, "possible respondents.", "Str");
    let extracted_question1 = extractSection(text, "\nDisagree", "NoYes");

    // Treat question 1 differntly since it has differnt options
    const chunks = extracted_question1.split("%");
    // 0, 100, 0.970.970.981.00100, 14Student regularly attended class1
    const question_chunks = chunks[3];
    const averagesChunk = chunks[2];
    const responses = parseInt(question_chunks, 10).toString();
    const question_n = question_chunks.match(/\d+$/)[0];
    const question_text = question_chunks.substring(responses.length, question_chunks.length - question_n.length);
    const question1 = 
    {   
        no: chunks[0],
        yes: chunks[1],
        uni_avg: averagesChunk.substring(0, 4),
        col_avg: averagesChunk.substring(4, 8),
        swen_avg: averagesChunk.substring(8, 12),
        avg: averagesChunk.substring(12, 16),
        top_two: averagesChunk.substring(16) + '%',
        n: responses,
        question_number: question_n,
        question: question_text,
    };
    let table = []
    table.push(question1);
    
    const lines = raw_table.split('\n').map(line => line.trim()).filter(line => line);
    for (let index = 0; index < lines.length; index++) {
        const element = lines[index];
        const info = parseTableInfo(element);
        table.push(info);
    }
    return table;
}
// gets the whole row
function parseTableInfo(line) {
  const parts = line.split('%');
  
  // parts looks like this:
  // ['93', '7', '0', '0', '0', '4.204.154.074.93100', '14Instructor was effective12']
  
  // The 6th item holds the averages AND the start of the next percentage
  const averagesChunk = parts[5]; 
  const questionChunk = parts[6];
  const responses = parseInt(questionChunk, 10).toString();
  const question_n = questionChunk.match(/\d+$/)[0];

  const question_text = questionChunk.substring(responses.length, questionChunk.length - question_n.length);

  return {
    str_agree: parts[0] + '%',
    agree: parts[1] + '%',
    neutral: parts[2] + '%',
    disagree: parts[3] + '%',
    str_disagree: parts[4] + '%',
    
    // Slice the averages explicitly by index
    uni_avg: averagesChunk.substring(0, 4),
    col_avg: averagesChunk.substring(4, 8),
    swen_avg: averagesChunk.substring(8, 12),
    avg: averagesChunk.substring(12, 16),
    top_two: averagesChunk.substring(16) + '%', // the leftover is the top_two number
    n: responses,
    question: question_text,
    question_number: question_n,
  };
}


async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const text = data.text;
    // console.log('=== Start PDF TEXT ===');
    // console.log(text);
    // console.log('=== END PD TEXT ===');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const scholarship = extractSection(text, 'Scholarship', 'Teaching');

    const publications_lines = extractSection(text, 'Publications, scholarly outcomes, or creative works:', 'Teaching');

    const serviceSection = extractSection(text, 'Service', 'Professional Development');
    const [scholarshipData, publicationData, serviceHours] = await Promise.all([
        parseGrantAI(scholarship),
        parsePublicationAI(publications_lines),
        parseServiceHoursAI(serviceSection) 
    ]);
    // const serviceSection = extractSection(text, 'Service', 'Professional Development');
    // const serviceHours = await parseServiceHoursAI(serviceSection);
    // const scholarshipData = await parseGrantAI(scholarship);
    // const publicationData = await parsePublicationAI(publications_lines);

    const extracted = {
        name: extractField(lines, 'Name'),
        rank: extractField(lines, 'Rank'),
        unit: extractField(lines, 'Unit(s)') || extractField(lines, 'Unit'),
        affiliations: extractField(lines, 'Affiliations'),
        period: extractField(lines, 'Period'),
        scholarship: scholarshipData,
        publication: publicationData,
        teaching: extractSection(text, 'Teaching', 'Student Mentoring'),
        student_mentoring: extractSection(text, 'Student Mentoring, Counts of Supported Students:', 'Service') ||
                           extractSection(text, 'Student Mentoring', 'Service'),
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

function parseTextResponses(text, lastName) {
    if (!lastName) return [];

    const questionRegex = /Question:\s*(.+)/g;
    const positions = [];
    let match;

    while ((match = questionRegex.exec(text)) !== null) {
        positions.push({
            question: match[1].trim(),
            index: match.index,
            end: match.index + match[0].length
        });
    }

    if (positions.length === 0) return [];

    const extractResponses = (chunk) => {
        const cleaned = chunk
            .replace(/Text\s*Responses\s*Instructor\s*\n?/g, '')
            .replace(/Page\s+\d+\/\d+\s*\n?/g, '')
            .replace(/Note:[\s\S]*$/, '')
            .trim();

        // Only split on lastName when followed by a newline or end-of-string,
        // so occurrences mid-sentence (e.g. "professor Meneely,") are not treated as delimiters
        const entryRegex = new RegExp(`([\\s\\S]+?)${lastName}(?=\\s*\\n|\\s*$)`, 'g');
        const responses = [];
        let entryMatch;
        while ((entryMatch = entryRegex.exec(cleaned)) !== null) {
            const response = entryMatch[1].trim();
            // Skip table data that leaked through (contains % chains, header keywords)
            const isTableData = /\d+%\d+%/.test(response)
                || /possible respondents/i.test(response)
                || /Instructor:/.test(response)
                || /NQuestion/.test(response);
            if (response && response.length > 5 && !isTableData) responses.push(response);
        }
        return responses;
    };

    // In the raw PDF extraction, each question's responses appear BEFORE its label.
    // For question[i], collect text between the previous label's end and this label's start.
    const sections = [];
    for (let i = 0; i < positions.length; i++) {
        const start = i === 0 ? 0 : positions[i - 1].end;
        const end = positions[i].index;
        const responses = extractResponses(text.substring(start, end));
        sections.push({ question: positions[i].question, responses });
    }

    // Responses after the last label are a continuation of the first question (page 2)
    const remaining = extractResponses(text.substring(positions[positions.length - 1].end));
    if (remaining.length > 0) {
        sections[0].responses.push(...remaining);
    }

    return sections;
}

async function parseTeachingEvalPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // Simple regex extraction
    const firstLine = lines[0] || '';
    const semesterMatch = firstLine.match(/(Fall|Spring|Summer)\s+(\d{4})/);
    const courseMatch = firstLine.match(/([A-Z]+\s+\d+)\s+(.+?)\s+Section/);

    let professor_name = null;
    for (const line of lines) {
        if (line.includes('Instructor:')) {
            const match = line.match(/Instructor:\s*([^(]+)/);
            if (match) professor_name = match[1].trim();
            break;
        }
    }

    const table = parseTeachEvalTable(text);

    // Last name is before the comma in "LastName, FirstName (Role)"
    const lastName = professor_name ? professor_name.split(',')[0].trim() : null;

    // Only pass the text after the table — use regex to handle spacing/encoding variations in "NQuestion Text"
    const tableEndMatch = /N\s*Question\s+Text/.exec(text);
    const textAfterTable = tableEndMatch ? text.substring(tableEndMatch.index + tableEndMatch[0].length) : text;
    const text_responses = parseTextResponses(textAfterTable, lastName);
    console.log(text_responses);

    return {
        semester: semesterMatch ? semesterMatch[1] : null,
        year: semesterMatch ? semesterMatch[2] : null,
        course_code: courseMatch ? courseMatch[1] : null,
        course_name: courseMatch ? courseMatch[2].trim() : null,
        professor_name,
        table,
        text_responses
    };
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

module.exports = { parsePDF, parseTeachingEvalPDF, parseCSV };
