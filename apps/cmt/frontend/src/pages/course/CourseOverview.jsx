import { Check, Loader2, PlusIcon, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex } from '@uiw/color-convert';
import { CMTJsonFetch } from '../../utils/api.js';
import { ColorOption } from '../../components/forms/ColorPicker.jsx';


export function CourseOverview() {
    const [courseOverview, setCourseOverview] = useState([]);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [edit, setEdit] = useState(false);
    const [courseId, setCourseId] = useState(0);
    
    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        CMTJsonFetch("GET", `course`).then(async response => {
            const result = await response.json();
            setCourseOverview(result ?? []);
        });
      };

    return (
        <>
            <Container>
                <div className='flex items-center mb-4 gap-4'>
                    <h1>My Courses</h1>
                        <Button onClick={() => {setModalOpen(true); setCourseId(0); setEdit(false)}} className='h-min' variant='outline-primary'>
                        <div className='flex gap-1 -ml-1'><PlusIcon />Create Course</div>
                        </Button>
                </div>
                <CourseCreationModal isOpen={modalOpen} setIsOpen={setModalOpen} isEdit={edit} courseId={courseId} refresh={fetchCourses}/>
                <Row className='gy-4'>
                    {courseOverview.map(course => (
                        <Col md={4}>
                            <Card className={`w-xl group hover:cursor-pointer`} onClick={() => navigate(`/courses/${course.id}`)}>
                                <Card.Header style={{background: course.color}} className='h-28 flex justify-end'>
                                    <Palette className={`hidden group-hover:block size-10 hover:size-12
                                    ${isDarkColor(course.color) ? 
                                        "text-gray-300 hover:text-white" : "text-gray-500 hover:text-black" }`
                                    }
                                    onClick={(e) =>{
                                        e.stopPropagation();
                                        setModalOpen(true);
                                        setEdit(true);
                                        setCourseId(course.id);
                                    }} />
                                </Card.Header>
                                <Card.Body className='h-28 text-2xl group-hover:underline group-hover:text-blue-500'>
                                    {course.classId} - {course.name}</Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    )
}


function isDarkColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);

  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}


export function ColorWheel({setColor}) {
    const [hsva, setHsva] = useState({ h: 122, s: 0, v: 90, a: 1 });
    return (
        <>
        <div className='flex items-center mt-4'>
            {/* @ts-ignore TODO: fix maybe the issue solves itself after all this typescript 6.0 stuff*/}
            <Wheel color={hsva} onChange={(color) => {
                setHsva(color.hsva)
                setColor(hsvaToHex(color.hsva))
            }} />
            <div style={{ width: '50%', height: 34, marginTop: 20, background: hsvaToHex(hsva), marginLeft: "2rem"}}></div>
        </div>
        </>
    );
}


function CourseCreationModal({isOpen, setIsOpen, isEdit, courseId, refresh}) {

    const [courseCode, setCourseCode] = useState('')
    const [courseName, setCourseName] = useState('')
    const [color, setColor] = useState('')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Submit</>)
    const [submitting, setSubmitting] = useState(false);

    const [warning, setWarning] = useState('');
    const [showWheel, setShowWheel] = useState(false);

    const navigate = useNavigate()

    function handleCourseCreation(e) {
        e.preventDefault()
        if (color === "rainbow" || !color){
            console.log("Pick a color!")
            setWarning('Please select a color!');
            return false;
        }
        setSubmitting(true);
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Creating...</>)
        CMTJsonFetch('POST', '/course', { courseCode, courseName, color }).then(async response => {
            setSubmitButtonElement(<><Check />Created!</>)
            const json = await response.json();
            setTimeout(async () => navigate(`/courses/${json.course.id}`), 500);
        }).catch(async error => {
            console.log(error)
            const data = await error.response.json();
            setWarning(data.details);
            setSubmitButtonElement(<><PlusIcon />Submit</>)
            setSubmitting(false);
        });
    }

    function handleColorEdit(e){
        e.preventDefault();
        if (color === "rainbow" || !color){
            console.log("Pick a color!")
            e.preventDefault();
            setWarning('Please select a color!');
            return false;
        }
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Submitting...</>)
        CMTJsonFetch('PUT', `course/${courseId}`, {color: color}).then(() => {
            setIsOpen(false);
            setSubmitting(false);
            setSubmitButtonElement(<><PlusIcon />Submit</>);
            refresh();
        });
    }

    function resetForm() {
        setCourseCode("");
        setCourseName("");
        setColor("");
        setWarning('');
        setSubmitting(false);
        setShowWheel(false);
    }


    return (
        <>
            <Modal show={isOpen} onExit={resetForm} onHide={() => setIsOpen(false)} centered>
                <Modal.Header closeButton>{!isEdit ? 'Create Course' : 'Edit Color'}</Modal.Header>
                <Modal.Body>
                    <div className={`${warning ? 'block' : 'hidden'} alert alert-danger`}>{warning}</div>
                    <Form onSubmit={!isEdit ? handleCourseCreation : handleColorEdit}>
                        <div className={`flex gap-10 mb-4 ${isEdit ? 'hidden' : 'block'}`}>
                            <div>
                                <Form.Label>Course Code</Form.Label>
                                <Form.Control type='text' placeholder='e.g. SWEN-101' value={courseCode} onChange={e => setCourseCode(e.target.value)} required={!isEdit} />
                            </div>
                            <div>
                                <Form.Label>Course Name</Form.Label>
                                <Form.Control type='text' placeholder='e.g. Freshman Seminar' value={courseName} onChange={e => setCourseName(e.target.value)} required={!isEdit} />
                            </div>
                        </div>
                        <Form.Label>Course Color</Form.Label>
                        <div className="flex gap-2 mb-4">
                            {/* // Colors are based of Open Colors, but adjusted using oklch.com to alter chroma/lightness to maintain contract for colorblind users */}
                            {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#405cc9", "#88e4bd", "#76d380", "rainbow"].map(hex =>
                                <ColorOption color={color} setColor={setColor} hex={hex} setShowWheel={setShowWheel}/>
                            )}
                            
                        </div>
                        {showWheel && <div className='mb-3'>{<ColorWheel setColor={setColor}/>}</div>}
                        <Button type='submit' disabled={submitting}>
                            <div className='flex gap-1 -ml-1 mr-1'>
                                {submitButtonElement}
                            </div>
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    )
}