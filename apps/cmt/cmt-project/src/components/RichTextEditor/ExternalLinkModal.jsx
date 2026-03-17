import { FileSymlink } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { Button, Modal, Spinner, Row, Col, Form } from "react-bootstrap"
import { CMTJsonFetch } from "../../utils/api"
import { getResourceDownloadUrl } from "../resources/ResourceManager"
import { SelectableResourceCard } from "../resources/resourceRenderers"

export function ExternalLinkModal({ editor, courseId }) {
    const [show, setShow] = useState(false)

    const [resources, setResources] = useState([])
    const [selectedResource, setSelectedResource] = useState(null)
    const [linkText, setLinkText] = useState('')
    const [loading, setLoading] = useState(false)

    const loadResources = useCallback(async () => {
        setLoading(true)

        CMTJsonFetch('GET', `resources/${courseId}`)
            .then(async response => setResources((await response.json()) || []))
            .catch(error => {
                console.error('Failed to load resources', error)
            }) // TODO: central error notifs
            .finally(() => setLoading(false))
    }, [courseId])

    const handleInsert = () => {
        if (!selectedResource) {
            return
        }

        const displayText = linkText.trim() || selectedResource.name
        const linkUrl = getResourceDownloadUrl(selectedResource.id)

        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl, target: '_blank' }).run()

        // Set the display text if provided
        if (displayText && displayText !== editor.getHTML()) {
            // Replace the selected text with the display text
            editor.chain().focus().insertContent(displayText).run()
        }

        // Set color to blue for consistency with external links
        if (!editor.isActive('textStyle', { color: '#0484c9' }) && !editor.isActive('textStyle', { backgroundColor: '#0484c9' }))
            editor.chain().focus().setColor('#0000FF').run()

        handleReset()
    }

    const handleReset = () => {
        setShow(false)
        setSelectedResource(null)
        setLinkText('')
    }

    useEffect(() => {
        if (courseId) loadResources()
    }, [courseId, loadResources])

    return (
        <>
                <Button
                    variant='outline-secondary'
                    onClick={() => setShow(true)}
                    >
                    <FileSymlink />
                </Button>

                <Modal show={show} onHide={handleReset} size='lg'>
                    <Modal.Header closeButton>
                        <Modal.Title>Insert Resource Link</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loading ? (
                            <div className='text-center'>
                                <Spinner animation='border' />
                            </div>
                        ) : resources.length === 0 ? (
                            <div className='text-center text-muted'>
                                <p>No resources found for this course.</p>
                                <p>Upload resources in the course dashboard to use them here.</p>
                            </div>
                        ) : (
                            <>
                                <Form.Group className='mb-3'>
                                    <Form.Label>Select Resource</Form.Label>
                                    <Row>
                                        {resources.map(resource => (
                                            <Col md={6} lg={4} key={resource.id} className='mb-3'>
                                                <SelectableResourceCard refresh={loadResources} resource={resource} selected={selectedResource} setSelected={setSelectedResource}/>
                                            </Col>
                                        ))}
                                    </Row>
                                </Form.Group>

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
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='secondary' onClick={handleReset}>
                            Cancel
                        </Button>
                        <Button variant='primary' onClick={handleInsert} disabled={!selectedResource || loading}>
                            Insert Link
                        </Button>
                    </Modal.Footer>
                </Modal>

        </>
    )
}