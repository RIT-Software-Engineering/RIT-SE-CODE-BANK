const pool = require('../db');

function parseDate(dateStr) {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    
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
        const pdfBuffer = data.pdf_data ? Buffer.from(data.pdf_data, 'base64') : null;
        
        // Check if identical content already exists for this faculty
        const existingForms = await conn.query(
            `SELECT h.form_id, h.teaching_section, h.service_section, h.administrative_responsibilities 
             FROM highlights h 
             JOIN forms f ON h.form_id = f.id 
             WHERE f.faculty_information_id = ?`,
            [data.faculty_id]
        );
        
        for (const form of existingForms) {
            if (form.teaching_section === (data.teaching || '') &&
                form.service_section === (data.service || '') &&
                form.administrative_responsibilities === (data.administrative || '')) {
                // Identical content found - update instead of create
                if (data.affiliations !== undefined) {
                    await conn.query(
                        'UPDATE faculty_information SET affiliations = ? WHERE faculty_id = ?',
                        [data.affiliations || null, data.faculty_id]
                    );
                }
                
                await conn.query(
                    'UPDATE highlights SET service_hours = ?, last_saved = NOW() WHERE form_id = ?',
                    [data.service_hours, form.form_id]
                );
                
                if (pdfBuffer) {
                    await conn.query('UPDATE forms SET pdf_data = ? WHERE id = ?', [pdfBuffer, form.form_id]);
                }
                
                return { success: true, formId: form.form_id, replaced: true };
            }
        }
        
        // No duplicate found - create new form
        if (data.affiliations !== undefined) {
            await conn.query(
                'UPDATE faculty_information SET affiliations = ? WHERE faculty_id = ?',
                [data.affiliations || null, data.faculty_id]
            );
        }
        
        const formResult = await conn.query(
            'INSERT INTO forms (faculty_information_id, time_submitted, pdf_data) VALUES (?, NOW(), ?)',
            [data.faculty_id, pdfBuffer]
        );
        const formId = Number(formResult.insertId);
        
        const studentSupportResult = await conn.query(
            'INSERT INTO student_support (other_contributions) VALUES (\'\')'
        );
        const studentSupportId = Number(studentSupportResult.insertId);
        
        if (data.publication && Array.isArray(data.publication)){
            for (const pub of data.publication) {
                const pubData = {
                    title: pub.title || '',
                    type: pub.type || '',
                    authors: JSON.stringify(pub.authors ?? [])
                }
                const pubResult = await conn.query(
                    'INSERT INTO publications (title, type, authors) VALUES (?, ?, ?) RETURNING id',
                    [pubData.title, pubData.type, pubData.authors]
                );

                await conn.query(
                    'INSERT INTO forms_publications (form_id, publication_id) VALUES (?,?)',
                    [formId, Number(pubResult[0].id)]
                );
            }
        }

        if (data.scholarship && Array.isArray(data.scholarship)) {
            for (const grant of data.scholarship) {
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
                    'INSERT INTO grants (title, funder, amount, start_date, end_date, faculty_role, faculty_share, comments, grant_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING grant_id',
                    [grantData.title, grantData.funder, grantData.amount, grantData.start_date, grantData.end_date, 
                     grantData.faculty_role, grantData.faculty_share, grantData.comments, grantData.grant_status]
                );
                
                await conn.query(
                    'INSERT INTO forms_grants (form_id, grant_id) VALUES (?, ?)',
                    [formId, Number(grantResult[0].grant_id)]
                );
            }
        }
        
        const result = await conn.query(
            'INSERT INTO highlights (form_id, student_support_id, administrative_responsibilities, professional_development, teaching_section, service_section, service_hours, student_mentoring, last_saved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [formId, studentSupportId, data.administrative, data.professional_development, data.teaching, data.service, data.service_hours, data.student_mentoring || null]
        );
        
        return { success: true, id: Number(result.insertId), formId, replaced: false };
    } finally {
        conn.release();
    }
}

async function updateParsedHighlights(formId, data) {
    const conn = await pool.getConnection();
    try {
        // Update faculty affiliations if provided
        if (data.affiliations !== undefined) {
            await conn.query(
                'UPDATE faculty_information SET affiliations = ? WHERE faculty_id = ?',
                [data.affiliations || null, data.faculty_id]
            );
        }
        
        // Update highlights record
        await conn.query(
            'UPDATE highlights SET administrative_responsibilities = ?, professional_development = ?, teaching_section = ?, service_section = ?, service_hours = ?, student_mentoring = ?, last_saved = NOW() WHERE form_id = ?',
            [data.administrative, data.professional_development, data.teaching, data.service, data.service_hours, data.student_mentoring || null, formId]
        );
        
        return { success: true, formId };
    } finally {
        conn.release();
    }
}

module.exports = { saveParsedHighlights, updateParsedHighlights };
