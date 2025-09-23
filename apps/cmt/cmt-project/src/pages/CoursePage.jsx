import {useState} from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Alert from 'react-bootstrap/Alert';
import "../styles/course.css";

function CoursePage(){
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [numOfSections, setNumOfSections] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const API_BASE = "http://localhost:5000/api";

  // add the event
  const handleSubmit = async (e) => {
    e.preventDefault();

    // add the course
    try {
      const courseResponse = await fetch(`${API_BASE}/courseCreation`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify ({
          id: courseId,
          name: courseName,
          semester: semester,
          professorId: 1  // TODO: REPLACE WITH REAL PROFESSORID
        })
      });

      if (!courseResponse.ok) {
        throw new Error("Failed to create a new course");
      }

      const courseData = await courseResponse.json();
      console.log("New course created: ", courseData);

      // create the # of sections
      for (let i = 1; i <= parseInt(numOfSections); i++) {
        const sectionResponse = await fetch(`${API_BASE}/sections`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            sectionNum: i,
            courseId: courseId,
            professorId: 1, // TODO: REPLACE WITH REAL PROFESSORID
            classTimes: []
          }),
        });

        if (!sectionResponse.ok) {
        throw new Error(`Failed to create section ${i}`);
      }

        const sectionData = await sectionResponse.json();
        console.log(`Section ${i} created: `, sectionData);
      }

      setShowAlert(true);
      // hides the alert after 6 secs
      setTimeout(() => setShowAlert(false), 6000);

      // clear the form fields
      setCourseId("");
      setCourseName("");
      setNumOfSections("");
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
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col>
            <Form.Group controlId="formCourseCode">
              <Form.Label>Course ID: </Form.Label>
              <Form.Control type="text" required value={courseId} onChange={(e) => setCourseId(e.target.value)}
                placeholder="ex. Swen101"></Form.Control>
            </Form.Group>
            </Col>

          <Col>
            <Form.Group controlId="formCourseName">
              <Form.Label>Course Name: </Form.Label>
              <Form.Control type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)}
                placeholder="ex. Freshmen Seminar"></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group controlId="formCourseSemester">
              <Form.Label>Semester: </Form.Label>
              <Form.Control type="text" required value={semester} onChange={(e) => setSemester(e.target.value)}
                placeholder="ex. Fall"></Form.Control>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formCourseSections">
              <Form.Label>Number of sections: </Form.Label>
              <Form.Control type="number" required value={numOfSections} onChange={(e) => setNumOfSections(e.target.value)}
                placeholder="ex. 2"></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group controlId="formFile">
          <Form.Label>Upload Syllabus</Form.Label>
          <Form.Control type ="file"></Form.Control>
        </Form.Group>

        <Button type="submit">Create Course</Button>
      </Form>
    </>
  )
}

export default CoursePage;
