import { Check, Loader2, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { CMTFetch } from '../../utils/api'
import { useNavigate } from 'react-router-dom'

export function CoursePageWorkflony() {
    const [courseOverview, setCourseOverview] = useState([{ name: 'Placeholder 1' }, { name: 'Placeholder 2' }])

    return (
        <>
            <Container>
                <div className='flex items-center mb-4 gap-4'>
                    <h1>Course Overview</h1>
                    <CourseCreationModal />
                </div>
                <Row className='gy-4'>
                    {courseOverview.map(course => (
                        <Col md={4}>
                            <Card>
                                <Card.Header>{course.name}</Card.Header>
                                <Card.Body></Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    )
}

function CourseCreationModal() {
    const [isOpen, setIsOpen] = useState(false)

    const [courseCode, setCourseCode] = useState('')
    const [courseName, setCourseName] = useState('')
    const [color, setColor] = useState('')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Create Course</>)

    const navigate = useNavigate()

    function handleCourseCreation(e) {
        e.preventDefault()
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Creating...</>)
        CMTFetch('POST', '/course', { courseCode, courseName, color }).then(async response => {
            setSubmitButtonElement(<><Check />Created!</>)
            const json = await response.json()
            setTimeout(async () => navigate(`/courses/${json.course.id}`), 500)
        })
    }

    function resetForm() {
        setCourseCode("")
        setCourseName("")
        setColor("")
    }

    return (
        <>
            <Modal show={isOpen} onExit={resetForm} onHide={() => setIsOpen(false)} centered>
                <Modal.Header closeButton>Create Course</Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCourseCreation}>
                        <div className='flex gap-10 mb-4'>
                            <div>
                                <Form.Label>Course Code</Form.Label>
                                <Form.Control type='text' placeholder='SWEN-101' value={courseCode} onChange={e => setCourseCode(e.target.value)} required />
                            </div>
                            <div>
                                <Form.Label>Course Name</Form.Label>
                                <Form.Control type='text' placeholder='Freshman Seminar' value={courseName} onChange={e => setCourseName(e.target.value)} required />
                            </div>
                        </div>
                        <Form.Label>Course Color</Form.Label>
                        <div className="flex gap-2 mb-4">
                            {/* // Colors are based of Open Colors, but adjusted using oklch.com to alter chroma/lightness to maintain contract for colorblind users */}
                            {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#405cc9", "#88e4bd", "#76d380"].map(hex =>
                                <ColorRadioOption color={color} setColor={setColor} hex={hex}/>
                            )}
                        </div>
                        <Button type='submit'>
                            <div className='flex gap-1 -ml-1 mr-1'>
                                {submitButtonElement}
                            </div>
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
            <Button onClick={() => setIsOpen(true)} className='h-min' variant='outline-primary'>
                <div className='flex gap-1 -ml-1'>
                    <PlusIcon />
                    Create Course
                </div>
            </Button>
        </>
    )
}

function ColorRadioOption({ color, setColor, hex}) {
    return (
        <div key={hex}>
            <Form.Check
                required
                type='radio'
                name='color'
                id={`color-${hex}`}
                value={hex}
                checked={color === hex}
                onChange={e => setColor(e.target.value)}
                className='d-none'
            />
            <label htmlFor={`color-${hex}`}>
                <div
                    className="w-8 h-8 rounded-full cursor-pointer"
                    style={{
                        backgroundColor: hex,
                        border: color === hex ? `4px solid color-mix(in oklab, #eee, ${hex}` : '4px solid #eee',
                    }}
                />
            </label>
        </div>
    )
}