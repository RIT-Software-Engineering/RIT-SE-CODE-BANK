import { Check, Loader2, PlusIcon } from 'lucide-react'
import { useEffect, useState, Fragment } from 'react'
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { CMTFetch } from '../../utils/api'
import { useNavigate } from 'react-router-dom'
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex } from '@uiw/color-convert';


export function CoursePageWorkflony() {
    const [courseOverview, setCourseOverview] = useState([{
    id: 0,
    classId: "",
    name: "",
    season: "",
    year: 0,
    color: "",
    students: "",
    section: ""
    }])
    const navigate = useNavigate();
    
    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        CMTFetch("GET", `events/courses`).then(async response => {
            const result = await response.json();
            if (result.data) {
            setCourseOverview(result.data);
          } else {
            setCourseOverview([]);
          }
        });
      };

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
                            <Card className={`w-xl hover:underline hover:text-blue-500 hover:cursor-pointer`} onClick={() => navigate(`/courses/${course.id}`)}>
                                <Card.Header style={{background: course.color}} className='h-28'></Card.Header>
                                <Card.Body className='h-28 text-2xl'>{course.classId} - {course.name}</Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    )
}


function ColorWheel({setColor}) {
    const [hsva, setHsva] = useState({ h: 122, s: 0, v: 90, a: 1 });
    return (
        <Fragment>
        <div className='flex items-center'>
            <Wheel color={hsva} onChange={(color) => {
            setHsva(color.hsva)
            setColor(hsvaToHex(color.hsva))
            }} />
            <div style={{ width: '50%', height: 34, marginTop: 20, background: hsvaToHex(hsva), marginLeft: "2rem"}}></div>
        </div>
        </Fragment>
    );
}

function CourseCreationModal() {
    const [isOpen, setIsOpen] = useState(false)

    const [courseCode, setCourseCode] = useState('')
    const [courseName, setCourseName] = useState('')
    const [color, setColor] = useState('')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Create Course</>)

    const [colorHidden, setColorHidden] = useState(true);
    

    const navigate = useNavigate()

    function handleCourseCreation(e) {
        e.preventDefault()
        if (color === "rainbow" || !color){
            console.log("Pick a color!")
            return false;
        }
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
        setColorHidden(true)
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
                            {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#405cc9", "#88e4bd", "#76d380", "rainbow"].map(hex =>
                                <ColorRadioOption color={color} setColor={setColor} hex={hex} setColorHidden={setColorHidden}/>
                            )}
                            
                        </div>
                        {colorHidden ? <></> : <div className='mb-3'>{<ColorWheel setColor={setColor}/>}</div>}
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

function ColorRadioOption({ color, setColor, hex, setColorHidden}) {
    return (
        <div key={hex}>
            <Form.Check
                // required
                type='radio'
                name='color'
                id={`color-${hex}`}
                value={hex}
                checked={color === hex}
                onChange={e => { if (hex === "rainbow"){setColorHidden(false); setColor(e.target.value)} 
                else{setColor(e.target.value); setColorHidden(true)}}}
                className='d-none'
            />
            <label htmlFor={`color-${hex}`}>
                <div
                    className="w-8 h-8 rounded-full cursor-pointer"
                    style={{
                        backgroundImage:
                            hex === "rainbow"
                                ? "conic-gradient(red, orange, yellow, green, cyan, blue, violet, red)"
                                : undefined,
                        backgroundColor: hex !== "rainbow" ? hex : undefined,
                        border: color === hex ? `4px solid color-mix(in oklab, #eee, ${hex}` : '4px solid #eee',
                    }}
                />
            </label>
        </div>
    )
}