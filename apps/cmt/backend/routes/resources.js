import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// TODO: this should integrate with SE hosting, for both homogeneity and not needing to download a new file every time you view it
// i.e. these files should go on nitron or whatever, and not the CMT container (probably)
// /cmt-project/uploads/resources
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'resources')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer config
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (_req, file, cb) {
        const name = `${uuidv4()}-${file.originalname}`
        cb(null, name)
    },
})

const upload = multer({
    storage: storage,
    fileFilter: function (_, file, cb) {
        // These correspond to mimetype headers and are neccesary for http
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'video/mp4',
            'video/avi',
            'video/mov',
            'audio/mpeg',
            'audio/wav',
        ]

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error(`Invalid file type ${file.mimetype}`))
        }
    },
})

/**
 * GET /api/cmt/resources/:courseId
 * Get all resources for a course
 */
router.get('/:courseId', async (req, res) => {
    const { courseId } = req.params
    const resources = await req.prisma.resource.findMany({
        where: { courseId: parseInt(courseId) },
        orderBy: { createdAt: 'desc' },
    })
    res.json(resources)
})

/**
 * POST /api/cmt/resources/:courseId
 * Upload a new resource
 */
router.post('/:courseId', upload.single('file'), async (req, res, next) => {
    try {
        const { courseId } = req.params
        const { name } = req.body

        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' })

        const resource = await req.prisma.resource.create({
            data: {
                name: name || req.file.originalname.replace(/\..+$/, ""),
                filename: req.file.originalname,
                mimeType: req.file.mimetype,
                filePath: req.file.path,
                courseId: parseInt(courseId),
            },
        })

        res.json(resource)
    } catch (error) {
        console.error('Error uploading resource:', error)

        // Clean up file if database creation failed
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError)
            }
        }
        next(error)
    }
})

/**
 * PUT /api/cmt/resources/:id
 * Update resource name
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { name } = req.body

    const resource = await req.prisma.resource.update({
        where: { id: id },
        data: { name },
    })

    res.json(resource)
})

/**
 * DELETE /api/cmt/resources/:id
 * Delete resource and file
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    const resource = await req.prisma.resource.findUnique({
        where: { id: id },
    })
    if (!resource) {
        console.error(`Resource with ID ${id} not found`)
        return res.status(404).json({ error: `Resource with ID ${id} not found` })
    }

    if (fs.existsSync(resource.filePath)) fs.unlinkSync(resource.filePath)

    await req.prisma.resource.delete({
        where: { id: id },
    })

    res.sendStatus(200)
})

/**
 * GET /api/cmt/resources/download/:id
 * Download resource file
 */
router.get('/download/:id', async (req, res) => {
    // Find in DB
    const { id } = req.params
    const resource = await req.prisma.resource.findUnique({
        where: { id: id },
    })
    if (!resource) {
        console.log(`File with ID ${id} not found in DB`)
        return res.status(404).json({ error: `File with ID ${id} not found in DB` })
    }

    // Find in filesystem
    if (!fs.existsSync(resource.filePath)) {
        console.log(`File with ID ${id} not found in filesystem`)
        return res.status(404).json({ error: `File with ID ${id} not found in filesystem` })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.filename)}"`)
    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream')
    res.setHeader('Content-Length', fs.statSync(resource.filePath).size)

    // File stream
    fs.createReadStream(resource.filePath)
        .on('error', streamError => {
            console.error(`Error reading file with ID ${id}: ${streamError}`)
            return res.status(500).json({ error: `Error reading file with ID ${id}: ${streamError}` })
        })
        .pipe(res)
})

export default router
