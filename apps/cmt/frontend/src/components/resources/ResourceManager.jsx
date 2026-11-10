import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Spinner, Button } from 'react-bootstrap'
import { RefreshCcw } from 'lucide-react'
import { CMTDangerAlert, createErrorHandler } from '../../utils/error'
import { UploadResourceModal } from './modals'
import { ResourceCard } from './resourceRenderers'
import { BASE_URL, CMTJsonFetch } from '../../utils/api'

/**
 * Generate the correct download URL for a resource based on the environment
 * @param {number} resourceId
 * @returns {string}
 */
export function getResourceDownloadUrl(resourceId) {
    return `${BASE_URL}/api/cmt/resources/download/${resourceId}`
}

/**
 * Resource management component for course-level resource management
 * @param {Object} props
 * @param {number} props.courseId
 */
export function ResourceManager({ courseId }) {
    
    const [resources, loading, loadResources, error] = useResources(courseId)

    return (
        <div>
            <div className='flex gap-4 py-2 mb-4 border-b items-center'>
                <div className='mb-0'>
                    <span className='text-3xl'>File Resources</span>
                    <p>Please do not upload files that contain sensitive or personal information.</p>
                </div>
                <div>
                    <UploadResourceModal courseId={courseId} refresh={loadResources} />
                </div>
                <Button onClick={loadResources} className="h-10" variant="outline-secondary">
                    {loading ? <Spinner animation='border'  /> : <RefreshCcw /> }
                </Button>
            </div>
            {loading ? (
                <div className='text-center'>
                    <Spinner animation='border' />
                    <p className='mt-2'>Loading resources...</p>
                </div>
            ) : error ? (
                <CMTDangerAlert error={error} />
            ) : resources.length === 0 ? (
                <div className='text-center text-muted'>
                    <p>No resources uploaded yet.</p>
                    <p>Upload files to make them available for linking in session materials.</p>
                </div>
            ) : (
                <Row className='max-h-72 overflow-y-scroll'>
                    {resources.map(resource => (
                        <Col md={5} lg={3} key={resource.id} className='mb-3'>
                            <ResourceCard resource={resource} refresh={loadResources} />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    )
}

/**
 * Hook to simplify calling resources across a couple of components
 * @param {Number} courseId 
 * @returns {[any[], boolean, () => Promise<void>, string | undefined]} [list of resources, whether its loading, function to refresh resources, error message if any]
 */
export function useResources(courseId) {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const loadResources = useCallback(() => {
        if (!courseId) return

        setError(null)
        setLoading(true)

        return CMTJsonFetch('GET', `resources/${courseId}`)
            .then(async json => setResources(json || []))
            .catch(createErrorHandler("Failed to load resources.", setError))
            .finally(() => setLoading(false))
    }, [courseId])

    useEffect(() => {
        if (courseId) loadResources()
    }, [courseId, loadResources])

    return [resources, loading, loadResources, error]
}
