import {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import {useRef} from 'react';


function CoursePage(){
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('');
  const [numOfSections, setNumOfSections] = useState('');

  const handleSubmit = (e) => {

  }

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId='formCourseCode'>
          <Form.Label>Course ID: </Form.Label>
          <Form.Control value={courseId} onChange={(e) => setCourseId(e.target.value)}
            placeholder='ex. Swen101'></Form.Control>
        </Form.Group>

        <Form.Group controlId='formCourseName'>
          <Form.Label>Course Name: </Form.Label>
          <Form.Control value={courseName} onChange={(e) => setCourseName(e.target.value)}
            placeholder='ex. Freshmen Seminar'></Form.Control>
        </Form.Group>

        <Form.Group controlId='formCourseSemester'>
          <Form.Label>Semester: </Form.Label>
          <Form.Control value={semester} onChange={(e) => setSemester(e.target.value)}
            placeholder='ex. Fall'></Form.Control>
        </Form.Group>

        <Form.Group controlId='formCourseSections'>
          <Form.Label>Number of sections: </Form.Label>
          <Form.Control value={numOfSections} onChange={(e) => setNumOfSections(e.target.value)}
            placeholder='ex. 2'></Form.Control>
        </Form.Group>

        <Button type="submit">Create Course</Button>
      </Form>
    </>
  )
}

export default CoursePage;

//export default function CoursePage() {
  //console.log("Loaded CoursePage.jsx");
  //return <h1>Course Builder</h1>;
//}
