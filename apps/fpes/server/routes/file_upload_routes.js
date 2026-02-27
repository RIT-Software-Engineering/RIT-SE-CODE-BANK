const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parsePDF, parseCSV } = require('../api/file_parser_api');
const { getFormPDF } = require('../api/forms_api');

const router = express.Router();
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { faculty_id } = req.body;
        if (!faculty_id) {
            return res.status(400).json({ error: 'faculty_id is required' });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let parsedData;

        if (fileExt === '.pdf') {
            parsedData = await parsePDF(filePath);
            parsedData.pdfData = fs.readFileSync(filePath).toString('base64');
        } else if (fileExt === '.csv') {
            parsedData = await parseCSV(filePath);
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        fs.unlinkSync(filePath);

        res.json({
            success: true,
            filename: req.file.originalname,
            data: parsedData,
            faculty_id
        });
    } catch (error) {
        console.error('Error parsing file:', error);
        res.status(500).json({ error: 'Failed to parse file: ' + error.message });
    }
});

router.get('/pdf/:formId', async (req, res) => {
    try {
        const pdfData = await getFormPDF(req.params.formId);
        if (!pdfData) {
            return res.status(404).json({ error: 'PDF not found' });
        }
        res.contentType('application/pdf');
        res.send(pdfData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve PDF' });
    }
});

module.exports = router;
