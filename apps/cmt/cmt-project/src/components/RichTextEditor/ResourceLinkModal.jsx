import { FileSymlink } from "lucide-react"
import { useState } from "react"
import { Button, Modal, Form, Col, Row, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap"
import { getResourceDownloadUrl, useResources } from "../resources/ResourceManager"
import { SelectableResourceCard } from "../resources/resourceRenderers"
import { CMTFormFetch } from "../../utils/api"
import { CMTDangerAlert, LogError } from "../../utils/error"

export function ResourceLinkModal({ editor, courseId }) {
    const [show, setShow] = useState(false)

    const [selectedResource, setSelectedResource] = useState(null)
    const [linkText, setLinkText] = useState('')

    const [resources, loading, loadResources, loadingError] = useResources(courseId)

    const handleInsert = () => {
        if (!selectedResource) {
            return
        }

        const displayText = linkText.trim() || selectedResource.name
        const linkUrl = getResourceDownloadUrl(selectedResource.id)

        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl, target: '_blank' }).run()

        // Replace the selected text with the display text
        if (displayText && displayText !== editor.getHTML()) {
            editor.chain().focus().insertContent(displayText).run()
        }

        // Set color
        if (!editor.isActive('textStyle', { color: '#0484c9' }) && !editor.isActive('textStyle', { backgroundColor: '#0484c9' }))
            editor.chain().focus().setColor('#0000FF').run()

        handleReset()
    }

    const handleReset = () => {
        setShow(false)
        setSelectedResource(null)
        setLinkText('')
    }

    // File upload stuff TODO: COPIED FROM reoucres/modals.jsx ):
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState(null)
    const [resourceName, setResourceName] = useState('')
    const [uploadError, setUploadError] = useState(null)
    
    const handleFileUpload = async e => {
        e.preventDefault()
        if (!file) {
            return
        }

        setUploading(true)
        setUploadError(null)

        const formData = new FormData()
        formData.append('file', file)
        if (resourceName?.trim()) {
            formData.append('name', resourceName.trim())
        }

        CMTFormFetch('POST', `resources/${courseId}`, formData)
            .then(_ => {
                loadResources()
                setFile(null)
                setResourceName('')
            })
            .catch(error => {
                let message;
                if (error.message && error.message.includes('Invalid file type'))
                    message = 'Invalid file type. Please upload a supported file (PDF, DOC, TXT, images, etc.).'
                LogError("Error uploading file.", error, setUploadError, message)
            })
            .finally(() => setUploading(false))
    }

    return (
        <>
                <OverlayTrigger delay={200} overlay={<Tooltip>Resource Link</Tooltip>}>
                    <Button
                        variant='outline-secondary'
                        onClick={() => setShow(true)}
                        >
                        <FileSymlink />
                    </Button>
                </OverlayTrigger>

                <Modal show={show} onHide={handleReset} size='xl'>
                    <Modal.Header closeButton>
                        <Modal.Title>Insert Resource Link</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="flex flex-col">
                            <div className="flex gap-10 justify-between">
                                <div className="w-1/2 flex flex-col">
                                    <p className="text-xl"> Select Existing Resource </p>
                                    {loading
                                        ? <div className='text-center'>
                                            <Spinner animation='border' />
                                            <p className='mt-2'>Loading resources...</p>
                                        </div>
                                    : loadingError 
                                        ? <CMTDangerAlert error={loadingError} />
                                    : resources.map(resource => (
                                            <div className="mb-3">
                                                <SelectableResourceCard resource={resource} refresh={loadResources} selected={selectedResource} setSelected={setSelectedResource}/>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p>or</p>
                                </div>
                                <div className="w-1/2 h-full flex flex-col">
                                    <p className="text-xl"> Upload New Resource </p>
                                {/* TODO: not copy paste this from resources/modals.jsx */}
                                    <Form onSubmit={e => { handleFileUpload(e); e.stopPropagation(); }}>
                                        <Form.Group className='mb-3'>
                                            <Form.Label>Resource Name</Form.Label>
                                            <Form.Control
                                                type='text'
                                                placeholder='Enter resource name (optional)'
                                                value={resourceName}
                                                onChange={e => setResourceName(e.target.value)}
                                            />
                                            <Form.Text className='text-muted'>If not provided, the original filename will be used</Form.Text>
                                        </Form.Group>
                                        <Form.Group className='mb-3'>
                                            <Form.Label>File</Form.Label>
                                            <Form.Control
                                                type='file'
                                                onChange={e => setFile(e.target.files?.[0] || null)}
                                                required
                                            />
                                        </Form.Group>
                                        <CMTDangerAlert error={uploadError} />
                                        <Button variant='primary' type='submit' disabled={uploading || !file}>
                                            {uploading ? (
                                                <>
                                                    <Spinner as='span' animation='border' size='sm' role='status' aria-hidden='true' className='me-2' />
                                                    Uploading...
                                                </>
                                            ) : (
                                                'Upload'
                                            )}
                                        </Button>
                                    </Form>
                                </div>
                            </div>
                            {selectedResource && (
                                <Form.Group className='mb-3'>
                                    <Form.Label>Link Display Text</Form.Label>
                                    <Form.Control
                                        type='text'
                                        placeholder={`${selectedResource.name}`}
                                        value={linkText}
                                        onChange={e => setLinkText(e.target.value)}
                                    />
                                    <Form.Text className='text-muted'>
                                        This is the text that will be displayed as the clickable link
                                    </Form.Text>
                                </Form.Group>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='secondary' onClick={handleReset}>
                            Cancel
                        </Button>
                        <Button variant='primary' onClick={handleInsert} disabled={!selectedResource}>
                            Insert Link
                        </Button>
                    </Modal.Footer>
                </Modal>

        </>
    )
}