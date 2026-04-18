import { FileSymlink } from "lucide-react"
import { useState } from "react"
import { Button, Modal, Form, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap"
import { CMTFormFetch } from "../../utils/api.js"
import { CMTDangerAlert, LogError } from "../../utils/error"
import { getResourceDownloadUrl, useResources } from "../resources/ResourceManager.jsx"
import { SelectableResourceCard } from "../resources/resourceRenderers.jsx"

export function ResourceLinkModal({ editor, courseId }) {
    const [show, setShow] = useState(false)

    const [selectedResource, setSelectedResource] = useState(null)
    const [linkText, setLinkText] = useState('')

    const [resources, loading, loadResources, loadingError] = useResources(courseId)

    const handleInsert = () => {
    if (!selectedResource) return

    const linkUrl = getResourceDownloadUrl(selectedResource.id)
    const displayText = linkText?.trim() || selectedResource.name

    const chain = editor.chain().focus()

    // AI-generated code
    chain.insertContent({
        type: 'text', 
        text: displayText,
        marks: [
            {
            type: 'link',
            attrs: { href: linkUrl, target: '_blank' }
            }
        ]
    }).command(({ tr }) => { // turns off link after inserting content
        tr.removeStoredMark(editor.schema.marks.link)
        return true
    }).run()

    handleReset()
}

    const handleReset = () => {
        setShow(false)
        setSelectedResource(null)
        setLinkText('')
    }

    const handleShow = () => {
        setLinkText(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' '));
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
        <OverlayTrigger delay={200} overlay={<Tooltip>Insert Resource</Tooltip>}>
            <Button
                variant='outline-secondary'
                onClick={() => setShow(true)}
                >
                <FileSymlink />
            </Button>
        </OverlayTrigger>

        <Modal show={show} onShow={handleShow} onHide={handleReset} size='xl'>
            <Modal.Header closeButton>
                <Modal.Title>Insert Resource File</Modal.Title>
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
                            : resources.length > 0 
                            ? resources.map(resource => (
                                    <div className="mb-3">
                                        <SelectableResourceCard resource={resource} refresh={loadResources} selected={selectedResource} setSelected={setSelectedResource}/>
                                    </div>
                                )) : 
                                <p>You have not added any resources yet.</p>
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
                                    <Form.Label>File</Form.Label>
                                    <Form.Control
                                        type='file'
                                        onChange={(e) => {
                                            const target = e.target;
                                            if ('files' in target) {
                                                setFile(target.files?.[0] || null);
                                            }
                                        }}
                                        required
                                    />
                                </Form.Group>
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
                                placeholder={selectedResource.name}
                                value={linkText || selectedResource.name}
                                onChange={e => setLinkText(e.target.value)}
                            />
                            <Form.Text className='text-muted'>
                                This is the text that will be displayed as a clickable link.
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