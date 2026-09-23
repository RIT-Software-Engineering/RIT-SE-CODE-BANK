import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Spinner, Button, Card } from 'react-bootstrap'
import { RefreshCcw } from 'lucide-react'
import { CMTDangerAlert, createErrorHandler } from '../../utils/error'
import { CMTJsonFetch } from '../../utils/api'
import { useParams } from 'react-router-dom'


/**
 * Holiday component for managing course-level holiday information
 * @param {Object} props
 * @param {number} props.courseId
 */
export function Holidays() {
    const {id} = useParams()
    const [holidays, loading, loadHolidays, error] = useHolidays(parseInt(id))

    return (
        <div>
            <div className='flex gap-4 py-2 mb-4 border-b items-center'>
                {/* <div className='mb-0'>
                    <span className='text-3xl'>Holidays</span>
                    <p>Add dates and/or ranges for holidays, breaks, and other days where the course will not meet! These dates will be skipped when generating session dates!</p>
                </div> */}
                <Button onClick={loadHolidays} className="h-10" variant="outline-secondary">
                    {loading ? <Spinner animation='border'  /> : <RefreshCcw /> }
                </Button>
            </div>
            {loading ? (
                <div className='text-center'>
                    <Spinner animation='border' />
                    <p className='mt-2'>Loading holidays...</p>
                </div>
            ) : error ? (
                <CMTDangerAlert error={error} />
            ) : holidays.length === 0 ? (
                <div className='text-center text-muted'>
                    <p>Holiday Name:</p>
                    <input type="text" className="form-control" placeholder="e.g. Thanksgiving" />
                    <Button>Submit</Button>

                    <p>Enter (start) date: </p>
                    <input type="date" className="form-control" />
                    <Button>Submit</Button>

                    <p>Enter end date (optional): </p>
                    <input type="date" className="form-control" />
                    <Button >Submit</Button>
                </div>
            ) : (
                <Row className='max-h-72 overflow-y-scroll'>
                    {holidays.map(holiday => (
                        <Col md={5} lg={3} key={holiday.id} className='mb-3'>
                            <Card>
                                <Card.Body>
                                    <Card.Title>{holiday.name}</Card.Title>
                                    <Card.Text>
                                        <p>Start Date:</p>
                                        <input type="date" className="form-control" value={(holiday.date).split('T')[0]} />
                                        <p>End Date:</p>
                                        <input type="date" className="form-control" value={(holiday.endDate).split('T')[0]} />
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    )
}

/**
 * Hook to simplify calling holidays across a couple of components
 * @param {Number} courseId 
 * @returns {[any[], boolean, () => Promise<void>, string | undefined]} [list of holidays, whether its loading, function to refresh holidays, error message if any]
 */
export function useHolidays(courseId) {
    const [holidays, setHolidays] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const loadHolidays = useCallback(() => {
        if (courseId){
            setError(null)
            setLoading(true)

            return CMTJsonFetch('GET', `holidays/${courseId}`)
                .then(async json => setHolidays(json.holidays || []))
                .catch(createErrorHandler("Failed to load holidays.", setError))
                .finally(() => setLoading(false))
        } else return
    }, [courseId])

    useEffect(() => {
        if (courseId) loadHolidays()
    }, [courseId, loadHolidays])

    return [holidays, loading, loadHolidays, error]
}
