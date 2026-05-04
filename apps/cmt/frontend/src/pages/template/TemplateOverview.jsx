// TODO this file is basically a copy of CourseOverview.jsx
// In the future it would be nice to get rid of this or remove a lot of the functionality so it's not total copy + paste

import {  Check, Loader2, PlusIcon, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Tab, Tabs } from 'react-bootstrap'
import { CMTJsonFetch } from '../../utils/api.js'
import { useNavigate } from 'react-router-dom'

/**
 * @import { SetStateAction } from "react"
 */

export function TemplateOverview() {
    const [templates, setTemplates] = useState([]);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [course, setCourse] = useState({});
    const [archiveOpen, setArchiveOpen] = useState(false);
    
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
                <CourseEditModal isOpen={editModalOpen} setIsOpen={setEditModalOpen} course={course} refresh={fetchCourses}/>
                <UnarchiveModal isOpen={archiveOpen} setIsOpen={setArchiveOpen} course={course} refresh={fetchCourses}/>
                <Tabs defaultActiveKey={"active"}  className='mb-3'>
                <Tab eventKey={"active"} title="Active">
                <Row className='gy-4'>
                    {templates.filter(template => template.active).map(course => (
                        <Col md={4}>
                            <Card className={`w-xl group hover:cursor-pointer`} onClick={() => navigate(`/templates/${course.id}`)}>
                                <Card.Header style={{background: "#0484c9"}} className='h-16 flex justify-end'>
                                <Settings className={`hidden group-hover:block size-8 hover:size-10 text-gray-300 hover:text-white`} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditModalOpen(true);
                                    setCourse(course);
                                }} />
                                </Card.Header>
                                <Card.Body className='text-2xl group-hover:underline group-hover:text-blue-500'>
                                    <div><span className='font-semibold'>Code:</span> {course.classId}</div>
                                    <div><span className='font-semibold'>Name:</span> {course.name}</div>
                                    <div><span className='font-semibold'>Season:</span> {course.season}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
                </Tab>
                <Tab eventKey={"archived"} title="Archived">
                    <Row className='gy-4'>
                    {templates.filter(template => !template.active).map(course => (
                        <Col md={4}>
                            <Card className={`w-xl group hover:cursor-pointer`} onClick={() => navigate(`/templates/${course.id}`)}>
                                <Card.Header style={{background: "#0484c9"}} className='h-16 flex justify-end'>
                                <Settings className={`hidden group-hover:block size-8 hover:size-10 text-gray-300 hover:text-white`} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveOpen(true);
                                    setCourse(course);
                                }} />
                                </Card.Header>
                                <Card.Body className='text-2xl group-hover:underline group-hover:text-blue-500'>
                                    <div><span className='font-semibold'>Code:</span> {course.classId}</div>
                                    <div><span className='font-semibold'>Name:</span> {course.name}</div>
                                    <div><span className='font-semibold'>Season:</span> {course.season}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
                </Tab>
                </Tabs>
            </Container>
        </>
    )
}

/**
 * Modal to create a template (despite the name)!
 * This is a reduced version of the course creation modal from CourseOverview.jsx
 * 
 * Here, the user only needs to input a code, a name, and the intended season.
 * The user doesn't select a color, and since they're creating a template, they cannot select a template for obvious reasons
 * 
 * We have them select a season to differentiate for profs. that use their template
 *
 * @param {Object} props 
 * @param {boolean} props.isOpen 
 * @param {React.Dispatch<SetStateAction<boolean>>} props.setIsOpen 
 * @returns {React.ReactElement}  
 */
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

/**
 * A modal for the settings of a template
 * Here you can copy the template or archive the template
 * Each thing is separated into a different tab for easy readability
 *
 * @param {Object} props 
 * @param {boolean} props.isOpen 
 * @param {React.Dispatch<SetStateAction<boolean>>} props.setIsOpen 
 * @param {Object} props.course 
 * @param {() => void} props.refresh 
 * @returns {React.ReactElement} 
 */
function CourseEditModal({isOpen, setIsOpen, course, refresh}){
    const [warning, setWarning] = useState('');
    const [courseCode, setCourseCode] = useState(course.classId ?? '')
    const [courseName, setCourseName] = useState(course.name ?? '')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Submit</>)
    const [submitting, setSubmitting] = useState(false);
        
    const navigate = useNavigate()

    function resetForm() {
        setIsOpen(false);
        setWarning('');
    }

    function handleCopy(){
            setSubmitting(true);
            setSubmitButtonElement(<><Loader2 className='animate-spin' />Creating...</>)
            CMTJsonFetch('POST', `/course/${course.id}`, 
                { 
                code: courseCode, name: courseName, color: '#000000', workflowId: course?.workflowId, toBeTemplate: true,
                }).then(async response => {
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

    return (
        <Modal show={isOpen} onHide={resetForm} onExit={resetForm} centered
        onShow={() => {setCourseCode(course.classId ?? ''); setCourseName(course.name ?? '')}}>
            <Modal.Header closeButton>Template Settings</Modal.Header>
                <Modal.Body>
                    <Alert variant='danger' className={`${warning ? 'block' : 'hidden'}`}>{warning}</Alert>
                    <Tabs className='mb-3'>
                    <Tab eventKey={"copy"} title="Copy Template">
                        <Form className='flex gap-5 items-center mb-3'>
                            <div>
                                <Form.Label>Course Code</Form.Label>
                                <Form.Control type='text' placeholder='e.g. SWEN-101' defaultValue={course.classId} value={courseCode} 
                                onChange={e => setCourseCode(e.target.value)} required={true} />
                            </div>
                            <div className='pt-2'>
                                <Form.Label>Course Name</Form.Label>
                                <Form.Control type='text' placeholder='e.g. Freshman Seminar' defaultValue={course.name} value={courseName} 
                                onChange={e => setCourseName(e.target.value)} required={true} />
                            </div>
                        </Form>
                        <Button onClick={handleCopy} disabled={submitting}>
                            <div className='flex gap-1 -ml-1 mr-1'>
                                {submitButtonElement}
                            </div>
                        </Button>
                    </Tab>
                    <Tab eventKey={"delete"} title="Delete Template">
                        <Alert variant="warning">
                            <h2>Warning!</h2>
                            <p>
                                This template will be removed from your active templates list and will become archived.
                                You can unarchive it later.
                                Are you sure you want to proceed?
                            </p>
                        </Alert>
                        <div className="flex justify-between">
                            <Button className="justify-start" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button className="justify-end" variant="danger" disabled={submitting}
                            onClick={() => {
                                CMTJsonFetch("DELETE", `/course/${course.id}`).then(refresh);
                                setIsOpen(false);
                            }}>Archive Template</Button>
                        </div>
                    </Tab>
                    </Tabs>
                </Modal.Body>
        </Modal>
    )
}

/**
 * Modal only for unarchiving a course
 * Separate from course edit modal so we don't have it as a single tab
 * Upon confirmation sets the course to be active again and removes it from the archived list
 *
 * @param {Object} props 
 * @param {boolean} props.isOpen 
 * @param {React.Dispatch<SetStateAction<boolean>>} props.setIsOpen 
 * @param {Object} props.course 
 * @param {() => void} props.refresh 
 * @returns {React.ReactElement} 
 */
function UnarchiveModal({isOpen, setIsOpen, course, refresh}) {
    return (<>
    <Modal show={isOpen} onHide={() => setIsOpen(false)} onExit={() => setIsOpen(false)} centered>
        <Modal.Header closeButton>Unarchive Course</Modal.Header>
        <Modal.Body>
            <Alert variant="warning">
                <p>
                    This course will be added back to your active templates list.
                    Are you sure you want to proceed?
                </p>
            </Alert>
            <div className="flex justify-between">
                <Button className="justify-start" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button className="justify-end" variant="danger"
                onClick={() => {
                    CMTJsonFetch("PUT", `/course/${course.id}`, {active: true}).then(refresh);
                    setIsOpen(false);
                }}>Unarchive Course</Button>
            </div>
        </Modal.Body>
    </Modal>
    </>)
}