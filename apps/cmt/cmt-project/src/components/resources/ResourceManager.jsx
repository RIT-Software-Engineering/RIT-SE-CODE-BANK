import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Spinner } from 'react-bootstrap'
import { CMTJsonFetch } from '../../utils/api'
import { ResourceCard } from './resourceRenderers'
import { UploadResourceModal } from './modals'

/**
 * Generate the correct download URL for a resource based on the environment
 * @param {number} resourceId - The ID of the resource to download
 * @returns {string}
 */
export function getResourceDownloadUrl(resourceId) {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const baseUrl = isDevelopment ? 'http://localhost:5010' : ''
    return `${baseUrl}/api/cmt/resources/download/${resourceId}`
}

/**
 * Resource management component for course-level resource management
 * @param {Object} props
 * @param {number} props.courseId - Course ID to manage resources for
 */
export function ResourceManager({ courseId }) {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(false)

    const loadResources = useCallback(async () => {
        if (!courseId) return

        setLoading(true)

        CMTJsonFetch('GET', `resources/${courseId}`)
            .then(async response => setResources((await response.json()) || []))
            .catch(error => { console.error('Failed to load resources', error) }) //TODO: central error notif system
            .finally(() => setLoading(false))
    }, [courseId])

    useEffect(() => {
        if (courseId) loadResources()
    }, [courseId, loadResources])

    return (
        <div>
            <div className='flex gap-4 py-4'>
                <span className='text-4xl mb-0'>Resources</span>
                <UploadResourceModal courseId={courseId} refresh={loadResources} />
            </div>
            {loading ? (
                <div className='text-center'>
                    <Spinner animation='border' />
                    <p className='mt-2'>Loading resources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className='text-center text-muted'>
                    <p>No resources uploaded yet.</p>
                    <p>Upload files to make them available for linking in session materials.</p>
                </div>
            ) : (
                <Row>
                    {resources.map(resource => (
                        <Col md={6} lg={4} key={resource.id} className='mb-3'>
                            <ResourceCard resource={resource} refresh={loadResources} />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    )
}
