import { Check, Loader2, PlusIcon, Palette, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Container, Form, Modal, Offcanvas, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex } from '@uiw/color-convert';
import { CMTJsonFetch } from '../../utils/api.js';
import { ColorOption } from '../../components/forms/ColorPicker.jsx';
import { LogError } from '../../utils/error.jsx';


export function CourseOverview() {
    const [courseOverview, setCourseOverview] = useState([]);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
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
                        <Button onClick={() => {setModalOpen(true); setCourseId(0);}} className='h-min' variant='outline-primary'>
                        <div className='flex gap-1 -ml-1'><PlusIcon />Create Course</div>
                        </Button>
                </div>
                <CourseCreationModal isOpen={modalOpen} setIsOpen={setModalOpen}/>
                <CourseEditModal isOpen={editModalOpen} setIsOpen={setEditModalOpen} courseId={courseId} refresh={fetchCourses}/>
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
                                        setEditModalOpen(true);
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

function CourseCreationModal({isOpen, setIsOpen}) {

    const [courseCode, setCourseCode] = useState('');
    const [courseName, setCourseName] = useState('');
    const [color, setColor] = useState('');

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [templateSearchOpen, setTemplateSearchOpen] = useState(false);

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Submit</>);
    const [submitting, setSubmitting] = useState(false);

    const [warning, setWarning] = useState('');
    const [showWheel, setShowWheel] = useState(false);

    const navigate = useNavigate();

    function handleCourseCreation(e) {
        e.preventDefault()
        if (!selectedTemplate){
            if (!courseCode){
                setWarning('Please fill in course code or choose a template.');
                return false;
            }
            else if (!courseName){
                setWarning('Please fill in course name or choose a template.');
                return false;
            }}
        if (color === "rainbow" || !color){
            setWarning('Please select a color.');
            return false;
        }
        setSubmitting(true);
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Creating...</>)
        CMTJsonFetch('POST', `/course${selectedTemplate ? `/${selectedTemplate.id}` : ''}`, 
            { 
            courseCode, courseName, color, workflowId: selectedTemplate?.workflowId,
            }).then(async response => {
            setSubmitButtonElement(<><Check />Created!</>)
            const json = await response.json();
            setTimeout(async () => navigate(`/courses/${json.course.id}`), 500);
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
        setColor("");
        setWarning('');
        setShowWheel(false);
        setSelectedTemplate(null);
    }

    const loadProfTemplates = async () => {
        setLoading(true);
        CMTJsonFetch('GET', `course/?isTemplate=true`)
            .then(async response => setTemplates((await response.json()) || []))
            .catch(error => LogError("Failed to load templates.", error, setWarning))
            .finally(() => setLoading(false))
    };

    useEffect(() => {
        loadProfTemplates();
    }, []);

    return (
        <>
            <TemplateSearchModal isOpen={templateSearchOpen} setIsOpen={setTemplateSearchOpen} selected={selectedTemplate} setSelected={setSelectedTemplate}/>
            <Modal size="lg" show={isOpen} onExit={resetForm} onHide={() => !templateSearchOpen && setIsOpen(false)} centered>
                <Modal.Header closeButton className='text-2xl'>Create Course</Modal.Header>
                <Modal.Body>
                    <div className='flex flex-col h-full pb-3 border-b'>
                    <div className={`${warning ? 'block' : 'hidden'} alert alert-danger`}>{warning}</div>
                    <div className='flex gap-10 justify-between'>
                        <div className='w-2/3 flex flex-col'>
                        <p className='text-xl'>Choose a template</p>
                        {loading
                            ? <div className='text-center'>
                                <Spinner animation='border' />
                                <p className='mt-2'>Loading resources...</p>
                            </div>
                        : templates.length > 0 
                        ? <div className="max-h-72 overflow-y-scroll">
                            {templates.map(template => (
                                <div className="mb-3">
                                    <SelectableTemplateCard template={template} selected={selectedTemplate} setSelected={setSelectedTemplate}/>
                                </div>
                            ))}
                            </div> : 
                            <p>You have not created a template. You can also try searching for a template.</p>
                        }
                        <Button variant='primary' onClick={() => setTemplateSearchOpen(true)}>
                            <div className='flex justify-between'>
                                <span>Search Public Templates</span> 
                                <span><Search className='-scale-x-100'/></span>
                            </div>
                        </Button>
                        </div>
                        <div className="flex flex-col justify-center"><p>OR</p></div>
                        <div className='w-1/2 flex flex-col'>
                        <p className='text-xl'>Create From Scratch</p>
                            <Form>
                                <div>
                                    <Form.Label>Course Code</Form.Label>
                                    <Form.Control type='text' placeholder='e.g. SWEN-101' value={courseCode} 
                                    onChange={e => {setCourseCode(e.target.value); setSelectedTemplate(null);}} required={true} />
                                </div>
                                <div className='pt-2'>
                                    <Form.Label>Course Name</Form.Label>
                                    <Form.Control type='text' placeholder='e.g. Freshman Seminar' value={courseName} 
                                    onChange={e => {setCourseName(e.target.value); setSelectedTemplate(null);}} required={true} />
                                </div>
                            </Form>
                        </div>
                    </div>
                    </div>
                    <Form.Label>Course Color</Form.Label>
                    <div className="flex gap-2 mb-4 min-w-full min-h-full">
                        {/* // Colors are based of Open Colors, but adjusted using oklch.com to alter chroma/lightness to maintain contract for colorblind users */}
                        {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#405cc9", "#88e4bd", "#76d380", "rainbow"].map(hex =>
                            <ColorOption color={color} setColor={setColor} hex={hex} setShowWheel={setShowWheel}/>
                        )}
                    </div>
                    {showWheel && <div>{<ColorWheel setColor={setColor}/>}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button disabled={submitting} onClick={handleCourseCreation}>
                        <div className='flex gap-1 -ml-1 mr-1'>
                            {submitButtonElement}
                        </div>
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

function CourseEditModal({isOpen, setIsOpen, courseId, refresh}){
    const [color, setColor] = useState('')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Submit</>)

    const [warning, setWarning] = useState('');
    const [showWheel, setShowWheel] = useState(false);

    function resetForm() {
        setIsOpen(false);
        setColor("");
        setWarning('');
        setShowWheel(false);
    }

    function handleColorEdit(e){
        e.preventDefault();
        if (color === "rainbow" || !color){
            e.preventDefault();
            setWarning('Please select a color.');
            return false;
        }
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Submitting...</>)
        CMTJsonFetch('PUT', `course/${courseId}`, {color: color}).then(() => {
            setIsOpen(false);
            setSubmitButtonElement(<><PlusIcon />Submit</>);
            refresh();
        });
    }

    return (
        <Modal show={isOpen} onHide={resetForm} onExit={resetForm} centered>
            <Modal.Header closeButton>Edit Color</Modal.Header>
                <Modal.Body>
                    <div className={`${warning ? 'block' : 'hidden'} alert alert-danger`}>{warning}</div>
                    <div className="flex gap-2 mb-4 min-w-full">
                        {/* // Colors are based of Open Colors, but adjusted using oklch.com to alter chroma/lightness to maintain contract for colorblind users */}
                        {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#405cc9", "#88e4bd", "#76d380", "rainbow"].map(hex =>
                            <ColorOption color={color} setColor={setColor} hex={hex} setShowWheel={setShowWheel}/>
                        )}
                    </div>
                    {showWheel && <div className='mb-3'>{<ColorWheel setColor={setColor}/>}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleColorEdit}>
                        <div className='flex gap-1 -ml-1 mr-1'>
                            {submitButtonElement}
                        </div>
                    </Button>
                </Modal.Footer>
        </Modal>
    )
}

export function ColorWheel({setColor}) {
    const [hsva, setHsva] = useState({ h: 122, s: 0, v: 90, a: 1 });
    return (
        <>
        <div className='flex items-center justify-between'>
            {/* @ts-ignore TODO: fix maybe the issue solves itself after all this typescript 6.0 stuff*/}
            <div className='inline'>
            <Wheel color={hsva} onChange={(color) => {
                setHsva(color.hsva)
                setColor(hsvaToHex(color.hsva))
            }} />
            </div>
            <div className='w-2/3 h-16 mt-5 ml-8 visible inline' style={{ background: hsvaToHex(hsva)}}>
            {/* <span className='min-w-1/2 h-1/3 invisible'>Test duysbaniuasndsian oaidnisandnasi asdno iausdbsia idbaisub diusab ibdsuiabiubsaui</span> */}
            </div>
        </div>
        </>
    );
}

function SelectableTemplateCard({template, selected, setSelected}) {
    const isSelected = template.id === selected?.id;

    return (
        <Card 
            className={`cursor-pointer ${isSelected ? 'border-primary' : 'border-secondary'}`}
            onClick={() => setSelected(prevTemplate => (prevTemplate !== template) ? template: null)}
        >
            <Card.Body className='pb-0 flex flex-column'>
                <div className='flex items-center w-max'>
                    <div className='flex-grow-1'>
                        <Card.Title className='mb-1'>
                            {template.classId} - {template.name}
                        </Card.Title>
                        <Card.Text className='text-muted text-base'>
                            <span>{template.season}</span>
                            <p>Created by: {template.professors.fname} {template.professors.lname}</p>
                        </Card.Text>
                    </div>
                    {isSelected && <Badge pill className="ml-4">Selected</Badge>}
                </div>
            </Card.Body>
        </Card>
    )
}

function TemplateSearchModal({isOpen, setIsOpen, selected, setSelected}) {
    return (
        <>
        <div onClick={()=>setIsOpen(false)} className={`bg-black opacity-10 absolute w-svw h-svh top-0 left-0 ${isOpen ? 'block' : 'hidden'}`} style={{zIndex:1060}}></div>
        <Offcanvas show={isOpen} onHide={() => setIsOpen(false)} onExit={()=>setIsOpen(false)}
        placement="end" style={{ width: '100%', maxWidth: '1040px', zIndex: 1070}}>
            <Offcanvas.Header closeButton>Search Templates</Offcanvas.Header>
            <Offcanvas.Body>TODO add the template search here!</Offcanvas.Body>
        </Offcanvas>
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