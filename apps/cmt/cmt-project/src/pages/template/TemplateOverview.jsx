import {  Check, Loader2, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { CMTJsonFetch } from '../../utils/api'
import { useNavigate } from 'react-router-dom'


export function TemplateOverview() {
    const [templates, setTemplates] = useState([]);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    
    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        CMTJsonFetch("GET", `/course?isTemplate=true`).then(async response => {
            const result = await response.json();
            setTemplates(result ?? [])
        });
      };

    return (
        <>
            <Container>
                <div className='flex items-center mb-4 gap-4'>
                    <h1>My Templates</h1>
                        <Button onClick={() => setModalOpen(true)} className='h-min' variant='outline-primary'>
                        <div className='flex gap-1 -ml-1'><PlusIcon />Create Template</div>
                        </Button>
                </div>
                <CourseCreationModal isOpen={modalOpen} setIsOpen={setModalOpen}/>
                <Row className='gy-4'>
                    {templates.map(course => (
                        <Col md={4}>
                            <Card className={`w-xl group hover:cursor-pointer`} onClick={() => navigate(`/templates/${course.id}`)}>
                                <Card.Header style={{background: "#0484c9"}} className='h-16'/>
                                <Card.Body className='text-2xl group-hover:underline group-hover:text-blue-500'>
                                    <div><span className='font-semibold'>Code:</span> {course.classId}</div>
                                    <div><span className='font-semibold'>Name:</span> {course.name}</div>
                                    <div><span className='font-semibold'>Season:</span> {course.season}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    )
}

function CourseCreationModal({isOpen, setIsOpen}) {

    const [courseCode, setCourseCode] = useState('')
    const [courseName, setCourseName] = useState('')
    const [season, setSeason] = useState('Fall')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Submit</>)
    const [submitting, setSubmitting] = useState(false);

    const [warning, setWarning] = useState('');

    const navigate = useNavigate()

    function handleCourseCreation(e) {
        e.preventDefault();
        const color = '#000000'; // We have to set this as color is a required attribute
        const isTemplate = true; // Used for the POST request
        setSubmitting(true);
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Creating...</>)
        CMTJsonFetch('POST', '/course', { courseCode, courseName, color, season, isTemplate }).then(async response => {
            setSubmitButtonElement(<><Check />Created!</>)
            const json = await response.json();
            setTimeout(async () => navigate(`/templates/${json.course.id}`), 500);
        }).catch(async error => {
            const data = await error.response.json();
            setWarning(data.details);
            setSubmitButtonElement(<><PlusIcon />Submit</>)
            setSubmitting(false);
        });
    }

    function resetForm() {
        setCourseCode("");
        setCourseName("");
        setSeason("Fall");
        setWarning('');
        setSubmitting(false);
    }


    return (
        <>
            <Modal size="lg" show={isOpen} onExit={resetForm} onHide={() => setIsOpen(false)} centered>
                <Modal.Header closeButton>Create Template</Modal.Header>
                <Modal.Body>
                    <div className={`${warning ? 'block' : 'hidden'} alert alert-danger`}>{warning}</div>
                    <Form onSubmit={handleCourseCreation}>
                        <div className={`flex gap-4 mb-4`}>
                            <div>
                                <Form.Label>Course Code</Form.Label>
                                <Form.Control type='text' placeholder='SWEN-101' value={courseCode} onChange={e => setCourseCode(e.target.value)} required />
                            </div>
                            <div>
                                <Form.Label>Course Name</Form.Label>
                                <Form.Control type='text' placeholder='Freshman Seminar' value={courseName} onChange={e => setCourseName(e.target.value)} required/>
                            </div>
                            <div>
                                <Form.Label>Season for when this course happens?</Form.Label>
                                <Form.Select onChange={e => setSeason(e.target.value)}>
                                    {["Fall", "Spring", "Summer 1", "Summer 2", "Summer 3"].map(season => {
                                        return <option>{season}</option>
                                    })}
                                </Form.Select>
                            </div>
                        </div>
                        <div className='flex justify-around'>
                            <Button type='submit' disabled={submitting}>
                                <div className='flex gap-1 -ml-1 mr-1'>
                                    {submitButtonElement}
                                </div>
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    )
}