const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parsePDF, parseCSV } = require('../api/file_parser_api');

const router = express.Router();

// Ensure uploads directory exists
// Under apps\fpes\server\uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('File upload request received');
    try {
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { faculty_id } = req.body;
        if (!faculty_id) {
            return res.status(400).json({ error: 'faculty_id is required' });
        }

        console.log('File received:', req.file.originalname, 'for faculty:', faculty_id);
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        let parsedData;

        if (fileExt === '.pdf') {
            parsedData = await parsePDF(filePath);
            
            // Save PDF to permanent location
            const pdfFileName = `${faculty_id}_${Date.now()}.pdf`;
            const permanentPath = path.join(uploadsDir, pdfFileName);
            fs.copyFileSync(filePath, permanentPath);
            parsedData.pdfFileName = pdfFileName;
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
            faculty_id: faculty_id
        });

        

    } catch (error) {
        console.error('Error parsing file:', error);
        res.status(500).json({ error: 'Failed to parse file: ' + error.message });
    }
});

router.get('/pdf/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'PDF not found' });
    }
});

module.exports = router;
