import { Check, Loader2, PlusIcon, Search, Settings } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Offcanvas, Row, Spinner, Tab, Tabs } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex } from '@uiw/color-convert';
import { CMTJsonFetch } from '../../utils/api.js';
import { ColorOption } from '../../components/forms/ColorPicker.jsx';
import { LogError } from '../../utils/error.jsx';

/**
 * @import { SetStateAction } from "react"
 */

export function CourseOverview() {
    const [courseOverview, setCourseOverview] = useState([]);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [course, setCourse] = useState({});
    
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
                        <Button onClick={() => {setModalOpen(true); setCourse({});}} className='h-min' variant='outline-primary'>
                        <div className='flex gap-1 -ml-1'><PlusIcon />Create Course</div>
                        </Button>
                </div>
                <CourseCreationModal isOpen={modalOpen} setIsOpen={setModalOpen}/>
                <CourseEditModal isOpen={editModalOpen} setIsOpen={setEditModalOpen} course={course} refresh={fetchCourses}/>
                <UnarchiveModal isOpen={archiveOpen} setIsOpen={setArchiveOpen} course={course} refresh={fetchCourses}/>
                <Tabs className="mb-3">
                <Tab eventKey={"active"} title="Active">
                <Row className='gy-4'>
                    {courseOverview.filter(course => course.active).map(course => (
                        <Col md={4}>
                            <Card className={`w-xl group hover:cursor-pointer`} onClick={() => navigate(`/courses/${course.id}`)}>
                                <Card.Header style={{background: course.color}} className='h-28 flex justify-end'>
                                    <Settings className={`hidden group-hover:block size-10 hover:size-12
                                    ${isDarkColor(course.color) ? 
                                        "text-gray-300 hover:text-white" : "text-gray-500 hover:text-black" }`
                                    }
                                    onClick={(e) =>{
                                        e.stopPropagation();
                                        setEditModalOpen(true);
                                        setCourse(course);
                                    }} />
                                </Card.Header>
                                <Card.Body className='h-28 text-2xl group-hover:underline group-hover:text-blue-500'>
                                    {course.classId} - {course.name}</Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
                </Tab>
                <Tab eventKey={"archived"} title="Archived">
                    <Row className='gy-4'>
                    {courseOverview.filter(course => !course.active).map(course => (
                        <Col md={4}>
                            <Card className={`w-xl group hover:cursor-pointer`} onClick={() => navigate(`/courses/${course.id}`)}>
                                <Card.Header style={{background: course.color}} className='h-28 flex justify-end'>
                                    <Settings className={`hidden group-hover:block size-10 hover:size-12
                                    ${isDarkColor(course.color) ? 
                                        "text-gray-300 hover:text-white" : "text-gray-500 hover:text-black" }`
                                    }
                                    onClick={(e) =>{
                                        e.stopPropagation();
                                        setArchiveOpen(true);
                                        setCourse(course);
                                    }} />
                                </Card.Header>
                                <Card.Body className='h-28 text-2xl group-hover:underline group-hover:text-blue-500'>
                                    {course.classId} - {course.name}</Card.Body>
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

function CourseCreationModal({isOpen, setIsOpen}) {

    const [courseCode, setCourseCode] = useState('');
    const [courseName, setCourseName] = useState('');
    const [color, setColor] = useState('');

    // templates stuff
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [originalTemplates, setOriginalTemplates] = useState([]);
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
        setTemplates(originalTemplates);
    }

    // get ALL templates that the professor owns (including unpublished)
    const loadProfTemplates = async () => {
        setLoading(true);
        CMTJsonFetch('GET', `course/?isTemplate=true`)
            .then(async response => {
                const data = (await response.json()) || [];
                setTemplates(data.filter(item => item.active));
                setOriginalTemplates(data.filter(item => item.active));
            })
            .catch(error => LogError("Failed to load templates.", error, setWarning))
            .finally(() => setLoading(false))
    };

    useEffect(() => {
        loadProfTemplates();
    }, []);

    return (
        <>
            <TemplateSearchModal isOpen={templateSearchOpen} setIsOpen={setTemplateSearchOpen} 
            selected={selectedTemplate} setSelected={setSelectedTemplate}
            templates={templates} setTemplates={setTemplates} originalTemplates={originalTemplates}/>
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
                                <p className='mt-2'>Loading templates...</p>
                            </div>
                        : templates.length > 0 
                        ? <div className="max-h-64 overflow-y-scroll mb-2">
                            {templates.map(template => (
                                <div className="mb-3">
                                    <SelectableTemplateCard template={template} selected={selectedTemplate} setSelected={setSelectedTemplate}/>
                                </div>
                            ))}
                            </div> : 
                            <p>You have not created templates or don't have any available. You can create one or try searching public templates.</p>
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

function CourseEditModal({isOpen, setIsOpen, course, refresh}){
    const [color, setColor] = useState('')
    const [courseCode, setCourseCode] = useState(course.classId ?? '')
    const [courseName, setCourseName] = useState(course.name ?? '')

    const [submitButtonElement, setSubmitButtonElement] = useState(<><PlusIcon />Submit</>)

    const [warning, setWarning] = useState('');
    const [showWheel, setShowWheel] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const navigate = useNavigate()
    
    function resetForm() {
        setIsOpen(false);
        setColor("");
        setWarning('');
        setShowWheel(false);
        setCourseCode('');
        setCourseName('');
    }

    function handleColorEdit(e){
        e.preventDefault();
        if (color === "rainbow" || !color){
            e.preventDefault();
            setWarning('Please select a color.');
            return false;
        }
        setSubmitButtonElement(<><Loader2 className='animate-spin' />Submitting...</>)
        CMTJsonFetch('PUT', `course/${course.id}`, {color: color}).then(() => {
            setIsOpen(false);
            setSubmitButtonElement(<><PlusIcon />Submit</>);
            refresh();
        });
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
            <Modal.Header closeButton>Course Settings</Modal.Header>
                <Modal.Body>
                    <Tabs className='mb-3'>
                    <Tab eventKey={"color"} title="Edit Color">
                        <div className={`${warning ? 'block' : 'hidden'} alert alert-danger`}>{warning}</div>
                        <div className="flex gap-2 mb-4 min-w-full">
                            {/* // Colors are based of Open Colors, but adjusted using oklch.com to alter chroma/lightness to maintain contract for colorblind users */}
                            {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#405cc9", "#88e4bd", "#76d380", "rainbow"].map(hex =>
                                <ColorOption color={color} setColor={setColor} hex={hex} setShowWheel={setShowWheel}/>
                            )}
                        </div>
                        {showWheel && <div className='mb-3'>{<ColorWheel setColor={setColor}/>}</div>}
                        <Button onClick={handleColorEdit} disabled={submitting}>
                            <div className='flex gap-1 -ml-1 mr-1'>
                                {submitButtonElement}
                            </div>
                        </Button>
                    </Tab>
                    <Tab eventKey={"copy"} title="Copy as Template">
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
                    <Tab eventKey={"archive"} title="Archive Course">
                        <Alert variant="warning">
                            <h2>Warning!</h2>
                            <p>
                                This template will be removed from your active courses list and will become archived.
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
                            }}>Archive Course</Button>
                        </div>
                    </Tab>
                    </Tabs>
                </Modal.Body>
        </Modal>
    )
}

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

/**
 * Modified component of resources
 * Displays a card for templates containing name, code, professor and season
 * TODO maybe add last created / last updated date?
 *
 * @param {Object} props 
 * @param {Object} props.template - the template to be displayed
 * @param {Object} props.selected - the selected template (if any)
 * @param {React.Dispatch<SetStateAction<Object>>} props.setSelected - sets the selected template 
 * @returns {React.ReactElement} 
 */
function SelectableTemplateCard({template, selected, setSelected}) {
    // If not provided a template we don't want to display anything
    if (!template){
        return (<></>);
    }
    const isSelected = template?.id === selected?.id;

    return (
        <Card 
            className={`cursor-pointer ${isSelected ? 'border-primary' : 'border-secondary'}  select-none`}
            onClick={() => setSelected(prevTemplate => (prevTemplate !== template) ? template: null)}
        >
            <Card.Body className={`${!isSelected ? 'pb-4' : 'pb-0'}`}>
                <div className='flex items-center'>
                    <div className='flex-grow-1'>
                        <Card.Title className='mb-1 text-break'>
                            {template?.classId} - {template?.name}
                        </Card.Title>
                        <Card.Text className='text-muted text-base'>
                            <span>{template?.season}</span>
                            <p>Created by: {template?.professors.fname} {template?.professors.lname}</p>
                        </Card.Text>
                    </div>
                </div>
                {isSelected && <Badge pill className='-pt-2 mb-2'>Selected</Badge>}
            </Card.Body>
        </Card>
    )
}

/**
 * Technically not a modal but same difference
 * sidebar view that displays all public templates and allows for searching through them
 * does NOT display a professor's unpublished templates
 *
 * @param {Object} props 
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {React.Dispatch<SetStateAction<Boolean>>} props.setIsOpen - used to close the modal
 * @param {Object} props.selected - the selected template (if any) 
 * @param {React.Dispatch<SetStateAction<Object>>} props.setSelected - set the selected template 
 * @param {Array<Object>} props.templates - all of the professor's templates. used for checking later
 * @param {React.Dispatch<SetStateAction<Object[]>>} props.setTemplates - sets the templates in the main view. used to add a possibly missing template.
 * @param {Array<Object>} props.originalTemplates - the original set of unaltered templates
 * @returns {React.ReactElement} 
 */
function TemplateSearchModal({isOpen, setIsOpen, selected, setSelected, templates, setTemplates, originalTemplates}) {
    const [allTemplates, setAllTemplates] = useState([]);
    const [shownTemplates, setShownTemplates] = useState([]);

    // gets all the public templates and displays them
    const setPublishedTemplates = useCallback(async () => {
        await CMTJsonFetch("GET", "/course/templates").then(async response => {
            const data = await response.json();
            data.sort((a, b) => parseInt(a.id) - parseInt(b.id)); // sort so we have the same order when searching
            setAllTemplates(data);
            setShownTemplates(data);
        })
    }, []);

    useEffect(() => void setPublishedTemplates(), [setPublishedTemplates]);

    // close the view and the choose a template view if a template outside of the prof's normal ones were selected.
    const closeModal = () => {
        const newTemplate = !templates.find(template => template.id === selected?.id)
        if (selected && newTemplate){
            // If we already have added one of the published templates, remove it and add the new one
            if (templates.length > originalTemplates.length)
                setTemplates(prev => [selected, ...prev.slice(1, prev.length)]);
            // if not, we just add it directly
            else
                setTemplates(prev => [selected, ...prev]);
        }
        // if the template isn't new, we remove the other published template and don't duplicate things
        else if (!newTemplate){
            setTemplates(originalTemplates);
        }
        setIsOpen(false);
        // Reset the shown templates view
        setShownTemplates(allTemplates);
    }

    // filters the templates by their tags that contain relevant information
    // makes an API request to get these
    const searchTags = async (searchValue) => {
        if (!searchValue) {
            setShownTemplates(allTemplates);
            return;
        }

        await CMTJsonFetch("GET", `/workflow/publishedTemplates?searchValue=${searchValue.toLowerCase()}`).then(async response => {
            const data = await response.json();
            
            // Partiall AI-generated code
            const newTemplates = data.flat().filter(val => val !== null).filter((value, index, self) => (index === self.findIndex((t) => (t?.id === value?.id))));
            newTemplates.sort((a, b) => parseInt(a.id) - parseInt(b.id)); // sort so we have the same order as before
            setShownTemplates(newTemplates)
        })
    };

    // debounce function so we don't send an API request every time we type something
    const debounce = (fn, delay = 1000) => {
        let timerId = null;
        return (...args) => {
            clearTimeout(timerId);
            timerId = setTimeout(() => fn(...args), delay);
        };
    };
    
    // AI-modified code
    const onInput = useCallback(
        debounce((searchValue) => {
            searchTags(searchValue);
        }, 500),
        [allTemplates] // Add dependencies that searchTags relies on
    );

    return (
        <>
        <div onClick={()=>closeModal()} className={`bg-black opacity-10 absolute w-svw h-svh top-0 left-0 ${isOpen ? 'block' : 'hidden'}`} style={{zIndex:1060}}></div>
        <Offcanvas show={isOpen}  onHide={()=>closeModal()} onExit={()=>closeModal()}
        placement="end" style={{ width: '100%', maxWidth: '1040px', zIndex: 1070}}>
            <Offcanvas.Header closeButton>Search Templates</Offcanvas.Header>
            <Offcanvas.Body>
                <div className='border-black border mx-2 mb-3 rounded-xl flex items-center'>
                <Search className='ml-2'/>
                <Form.Control className='ml-2' plaintext placeholder="Search"
                onChange={(e) => {
                    onInput(e.target.value);
                }}></Form.Control>
                </div>
                {/* AI-modified code
                Display 2 items per row */}
                {shownTemplates.length > 0 ? 
                <Container>
                <Row>
                    {shownTemplates.map(template => (
                    <Col xs={6} key={template?.id} className="mb-3">
                        <div onClick={() => closeModal()}>
                        <SelectableTemplateCard 
                            template={template} 
                            selected={selected} 
                            setSelected={setSelected} 
                        />
                        </div>
                    </Col>
                    ))}
                </Row>
                </Container> : <p>No templates found.</p>}
            </Offcanvas.Body>
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