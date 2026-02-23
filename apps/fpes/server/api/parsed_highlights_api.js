const pool = require('../db');

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Try to parse common date formats
    const trimmed = dateStr.trim();
    
    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    
    // Try parsing M/D/YYYY or MM/DD/YYYY
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const [, month, day, year] = slashMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
}

function mapGrantStatus(status) {
    if (!status) return 'In Development';
    
    const normalized = status.toLowerCase().trim();
    
    if (normalized.includes('fund')) return 'Funded';
    if (normalized.includes('submit')) return 'In Submission';
    if (normalized.includes('declin') || normalized.includes('reject')) return 'Declined';
    if (normalized.includes('develop')) return 'In Development';
    
    return 'In Development';
}

async function saveParsedHighlights(data) {
    const conn = await pool.getConnection();
    try {
        // Update faculty information with parsed data if provided
        if (data.affiliations !== undefined) {
            await conn.query(
                `UPDATE faculty_information SET affiliations = ? WHERE faculty_id = ?`,
                [data.affiliations || null, data.faculty_id]
            );
        }
        
        // First create a form entry
        const formResult = await conn.query(
            `INSERT INTO forms (faculty_information_id, time_submitted) VALUES (?, NOW())`,
            [data.faculty_id]
        );
        
        const formId = Number(formResult.insertId);
        
        // Create a minimal student_support record
        const studentSupportResult = await conn.query(
            `INSERT INTO student_support (other_contributions) VALUES ('')`
        );
        const studentSupportId = Number(studentSupportResult.insertId);
        
        // Save scholarship/grants if provided
        if (data.scholarship && Array.isArray(data.scholarship)) {
            for (let grant of data.scholarship) {
                // Map parsed fields to database fields
                const grantData = {
                    title: grant.title || '',
                    funder: grant.funder || '',
                    amount: grant.amount || null,
                    start_date: grant.period ? parseDate(grant.period.split('-')[0]) : null,
                    end_date: grant.period ? parseDate(grant.period.split('-')[1]) : null,
                    faculty_role: grant.role || null,
                    faculty_share: grant.share ? parseFloat(grant.share.toString().replace('%', '')) : null,
                    grant_status: mapGrantStatus(grant.progress),
                    comments: grant.additional_comments || ''
                };
                
                const grantResult = await conn.query(
                    `INSERT INTO grants (title, funder, amount, start_date, end_date, faculty_role, faculty_share, comments, grant_status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING grant_id`,
                    [grantData.title, grantData.funder, grantData.amount, grantData.start_date, grantData.end_date, 
                     grantData.faculty_role, grantData.faculty_share, grantData.comments, grantData.grant_status]
                );
                const grant_id = Number(grantResult[0].grant_id);
                
                await conn.query(
                    `INSERT INTO forms_grants (form_id, grant_id) VALUES (?, ?)`,
                    [formId, grant_id]
                );
            }
        }
        
        // Then save highlights with the new form_id and student_support_id
        const result = await conn.query(
            `INSERT INTO highlights (form_id, student_support_id, administrative_responsibilities, last_saved, pdf_filename) 
             VALUES (?, ?, ?, NOW(), ?)`,
            [formId, studentSupportId, data.administrative, data.pdfFileName || null]
        );
        return { success: true, id: Number(result.insertId), formId };
    } finally {
        conn.release();
    }
}

module.exports = { saveParsedHighlights };
