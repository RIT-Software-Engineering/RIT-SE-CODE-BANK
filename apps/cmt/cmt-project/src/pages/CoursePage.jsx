import {useState} from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import Alert from 'react-bootstrap/Alert';
import "../styles/course.css";

function CoursePage(){
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [color, setColor] = useState("");
  const [numOfStudents, setStudents] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const API_BASE = "http://localhost:5000/api";

  // add the event
  const handleSubmit = async (e) => {
    e.preventDefault();

    // add the course
    try {
      const courseResponse = await fetch(`${API_BASE}/course`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify ({
          id: courseId,
          name: courseName,
          semester: semester,
          color: color,
          students: numOfStudents,
          professorId: 1  // TODO: REPLACE WITH REAL PROFESSORID
        })
      });

      if (!courseResponse.ok) {
        throw new Error("Failed to create a new course");
      }

      const courseData = await courseResponse.json();
      console.log("New course created: ", courseData);

      setShowAlert(true);
      // hides the alert after 6 secs
      setTimeout(() => setShowAlert(false), 6000);

      // clear the form fields
      setCourseId("");
      setCourseName("");
      setColor("");
      setStudents("");
      setSemester("");

    } catch (err) {
      console.error(err.message);
    }
  }

  // TODO nothing happens with the syllabus upload yet
  return (
    <>
      <h1>Create a course</h1>

      {showAlert && (<Alert variant="success" onClose={() => setShowAlert(false)} dismissible>
        ✅ Course and section(s) created successfully!
      </Alert>)}
      <Form className="course-form" onSubmit={handleSubmit}>
        <Row>
          <Col>
            <Form.Group id="formCourseCode">
              <Form.Label>Course ID: </Form.Label>
              <Form.Control type="text" required value={courseId} onChange={(e) => setCourseId(e.target.value)}
                placeholder="ex. Swen101"></Form.Control>
            </Form.Group>
            </Col>

          <Col>
            <Form.Group id="formCourseName">
              <Form.Label>Course Name: </Form.Label>
              <Form.Control type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)}
                placeholder="ex. Freshmen Seminar"></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group id="formNumOfStudents">
              <Form.Label>Number of students: </Form.Label>
              <Form.Control type="number" required value={numOfStudents} onChange={(e) => setStudents(e.target.value)}
                placeholder="ex. 15"></Form.Control>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group id="formCourseSemester">
              <Form.Label>Semester: </Form.Label>
              <Form.Control type="text" required value={semester} onChange={(e) => setSemester(e.target.value)}
                placeholder="ex. Fall"></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Form.Group id="formCourseColor">
            <Form.Label>Select a color: </Form.Label>
            <Form.Select requried value={color} onChange={(e) => setColor(e.target.value)}>
              <option value=""></option>
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="pink">Pink</option>
              <option value="brown">Brown</option>
              <option value="gray">Gray</option>
            </Form.Select>
          </Form.Group>
        </Row>

        <Row>
          <Form.Group id="formFile">
            <Form.Label>Upload Syllabus</Form.Label>
            <Form.Control type ="file"></Form.Control>
          </Form.Group>
        </Row>
        
        <div id="button-wrapper">
          <Button id="form-button" type="submit">Create Course</Button>
        </div>
      </Form>
    </>
  )
}

export default CoursePage;
