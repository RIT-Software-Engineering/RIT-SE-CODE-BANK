import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Spinner, Button, Card } from 'react-bootstrap'
import { RefreshCcw } from 'lucide-react'
import { CMTDangerAlert, createErrorHandler } from '../../utils/error'
import { CMTJsonFetch } from '../../utils/api'
import { useParams } from 'react-router-dom'

/**
 * Card representing a single holiday entry from the database
 * @param {Object} props
 * @param {Object} props.holiday - holiday entry with shape {courseId,  date, endDate, id, name} 
 * @param {Function} props.onChange - callback triggered when holiday is updated
 * @param {Function} props.onDelete - callback triggered when holiday is deleted
 * @returns HolidayCard component
 */
function HolidayCard({ holiday, onChange, onDelete }) {
    // local state from holiday prop
    const [name, setName] = useState(holiday.name)
    const [date, setDate] = useState((holiday.date).split('T')[0])
    const [endDate, setEndDate] = useState((holiday.endDate)?.split('T')[0]) ?? ''

    // tracks if any edits have been made - used to disable/enable buttons
    const [isUpdated, setIsUpdated] = useState(false)

    return (
        <Col md={5} lg={3} key={holiday.id} className='mb-3'>
            <Card>
                <Card.Body>
                    <Card.Title>{holiday.name}</Card.Title>
                    <Card.Text>
                        <p>Holiday Name:</p>
                        <input type="text" 
                        value = {name}
                        onChange = {(e) => {
                            setName(e.target.value)
                            setIsUpdated(true)
                        }} 
                        className="form-control" 
                        placeholder="e.g. Thanksgiving" />
                        
                        <p>Start Date:</p>
                        <input type="date" 
                        value={date}
                        onChange = {(e) => {
                            setDate(e.target.value)
                            setIsUpdated(true)
                        }} 
                        className="form-control" />

                        <p>End Date:</p>
                        <input type="date" 
                        className="form-control" 
                        value={endDate}
                        onChange = {(e) => {
                            setEndDate(e.target.value)
                            setIsUpdated(true)
                        }} />

                        <Button disabled={!isUpdated} onClick = {() => onChange(holiday.id, {name, date, endDate})}>
                            Edit Holiday</Button>
                        <Button onClick = {() => onDelete(holiday.id)}>
                            Remove Holiday</Button>
                    </Card.Text>
                </Card.Body>
            </Card>
        </Col>
    )

}

/**
 * Holiday component for managing course-level holiday information
 */
export function Holidays() {
    const {id} = useParams()
    const [holidays, loading, loadHolidays, error] = useHolidays(parseInt(id))

    // holiday form state
    const [holidayName, setHolidayName] = useState('')
    const [startDate, setDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // handlers for form submission and updates holiday data
    const onSubmit = () => {
        CMTJsonFetch('POST', `holidays`, { 
            name: holidayName, 
            date: new Date(startDate).toISOString(), 
            endDate: endDate ? new Date(endDate).toISOString() : null, id: parseInt(id)
        }).then(() => {
            loadHolidays()
            setHolidayName('')
            setDate('')
            setEndDate('')
        })
    }

    const onChange = (holidayId, updatedHoliday) => {
        CMTJsonFetch('PUT', `holidays/${holidayId}`, { 
            name: updatedHoliday.name, 
            date: new Date(updatedHoliday.date).toISOString(), 
            endDate: updatedHoliday.endDate ? new Date(updatedHoliday.endDate).toISOString() : null
        }).then(() => {
            loadHolidays()
        })
    }

    const onDelete = (holidayId) => {
        CMTJsonFetch('DELETE', `holidays/${holidayId}`).then(() => {
            loadHolidays()
        })
    }

    return (
        <div>
            <div className='flex gap-4 py-2 mb-4 border-b items-center'>
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
            ) : (
                <div className='text-center text-muted'>
                    <p>Holiday Name:</p>
                    <input type="text" 
                    value = {holidayName}
                    onChange = {(e) => setHolidayName(e.target.value)} 
                    className="form-control" 
                    placeholder="e.g. Thanksgiving" />

                    <p>Enter (start) date: </p>
                    <input type="date" 
                    value = {startDate}
                    onChange = {(e) => setDate(e.target.value)} 
                    className="form-control" />

                    <p>Enter end date (optional): </p>
                    <input type="date" 
                    value = {endDate}
                    onChange = {(e) => setEndDate(e.target.value)} 
                    className="form-control" />
                    
                    <Button disabled={!holidayName || !startDate} onClick = {() => onSubmit()}>Add Holiday</Button>

                    {holidays.length > 0 && ( 
                    <Row className='max-h-72 overflow-y-scroll'>
                        {holidays.map((holiday) => {
                            return (
                                <HolidayCard key={holiday.id} holiday={holiday} onChange={onChange} onDelete={onDelete} />
                            )
                        })}
                    </Row>
                    )}
                </div>
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
