import { PlusIcon, Pencil, Trash } from 'lucide-react'
import { useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import { CMTFormFetch, CMTJsonFetch } from '../../utils/api'
import { CMTDangerAlert, LogError } from '../../utils/error'

export function UploadResourceModal({ courseId, refresh }) {
    const [showModal, setShowModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState(null)
    const [resourceName, setResourceName] = useState('')
    const [error, setError] = useState(null)

    const handleFileUpload = async e => {
        e.preventDefault()
        if (!file) {
            return
        }

        setUploading(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)
        if (resourceName?.trim()) {
            formData.append('name', resourceName.trim())
        }

        CMTFormFetch('POST', `resources/${courseId}`, formData)
            .then(_ => {
                refresh()
                setShowModal(false)
                setFile(null)
                setResourceName('')
            })
            .catch(error => {
                let message;
                if (error.message && error.message.includes('Invalid file type'))
                    message = 'Invalid file type. Please upload a supported file (PDF, DOC, TXT, images, etc.).'
                LogError("Error uploading file.", error, setError, message)
            })
            .finally(() => setUploading(false))
    }

    return (
        <>
            <Button variant='outline-primary' onClick={() => setShowModal(true)} size='sm'>
                <div className='flex gap-1 items-center'>
                    <PlusIcon />
                    <p className='mb-0'>Upload Resource</p>
                </div>
            </Button>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload Resource</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleFileUpload}>
                    <Modal.Body>
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
                            <CMTDangerAlert error={error} />
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
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='secondary' onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
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
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export function EditResourceModal({ resource, refresh }) {
    const [showEditModal, setShowEditModal] = useState(false)
    const [editedResource, setEditedResource] = useState(resource)
    const [error, setError] = useState(null)

    const handleEditResource = async e => {
        e.preventDefault()
        e.stopPropagation()

        CMTJsonFetch('PUT', `resources/${resource.id}`, { name: editedResource.name.trim() || resource.name })
            .then(async _ => {
                refresh()
                setShowEditModal(false)
                setEditedResource(null)
            })
            .catch(error => LogError('An internal error ocurred when attempting to edit resource.', error, setError))
    }

    return (
        <>
            <Button
                variant='outline-warning'
                size='sm'
                onClick={e => {
                    e.stopPropagation()
                    setEditedResource(resource)
                    setError(null)
                    setShowEditModal(true)
                }}
            >
                <Pencil size={16} />
            </Button>
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Resource</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditResource}>
                    <Modal.Body>
                        <Form.Group className='mb-3'>
                            <Form.Label>Resource Name</Form.Label>
                            <Form.Control
                                type='text'
                                value={editedResource.name}
                                onChange={e => setEditedResource(editedResource => ({ ...editedResource, name: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <CMTDangerAlert error={error} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='secondary' onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant='primary' type='submit'>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export function DeleteResourceModal({ refresh, resource }) {
    const [showModal, setShowModal] = useState(false)
    const [error, setError] = useState(null)
 
    const handleDeleteResource = async resourceId => {
        CMTJsonFetch('DELETE', `resources/${resourceId}`)
            .then(refresh)
            .catch(error => LogError("Error deleting resource.", error, setError))
    }

    return (
        <>
            <Button
                variant='outline-danger'
                size='sm'
                onClick={_ => { setError(null); setShowModal(true) }}
            >
                <Trash size={16} />
            </Button>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <p className='text-2xl mb-0'>Confirm Resource Deletion</p>
                </Modal.Header>
                <Modal.Body>
                    <CMTDangerAlert error={error} />
                    <Button variant='danger' onClick={() => handleDeleteResource(resource.id)}>
                        Delete Resource Permanently
                    </Button>
                </Modal.Body>
            </Modal>
        </>
    )
}
