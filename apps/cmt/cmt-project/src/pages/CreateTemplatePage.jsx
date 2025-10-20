import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import "../styles/course.css";

function CreateTemplatePage() {
  const [showForm, setShowForm] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [semester, setSemester] = useState("");
  const [numWeeks, setNumWeeks] = useState("");
  const [numAssignments, setNumAssignments] = useState("");
  const [numExams, setNumExams] = useState("");
  const [numLabs, setNumLabs] = useState("");
  const [numProjects, setNumProjects] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const API_BASE = "http://localhost:5000/api";

  // Fetch existing templates when component loads
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/template/professor/1`); // TODO: REPLACE WITH REAL PROFESSORID
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const templateResponse = await fetch(`${API_BASE}/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          semester: semester,
          weeks: numWeeks,
          assignments: numAssignments,
          exams: numExams,
          labs: numLabs,
          projects: numProjects,
          professorId: 1, // TODO: REPLACE WITH REAL PROFESSORID
        }),
      });

      if (!templateResponse.ok) {
        throw new Error("Failed to create template");
      }

      const templateData = await templateResponse.json();
      console.log("New template created: ", templateData);

      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      // Clear form fields
      setTemplateName("");
      setSemester("");
      setNumWeeks("");
      setNumAssignments("");
      setNumExams("");
      setNumLabs("");
      setNumProjects("");

      // Refresh templates list and hide form
      fetchTemplates();
      setShowForm(false);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Template list view
  if (!showForm) {
    return (
      <>
        <h1>Course Templates</h1>
        <p>View and manage your course templates</p>

        {showAlert && (
          <Alert
            variant="success"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            ✅ Template created successfully!
          </Alert>
        )}

        <Button
          variant="primary"
          className="mb-4"
          onClick={() => setShowForm(true)}
        >
          + Create New Template
        </Button>

        <Row>
          {templates.length === 0 ? (
            <Col>
              <p>
                No templates found. Create your first template to get started!
              </p>
            </Col>
          ) : (
            templates.map((template) => (
              <Col md={6} lg={4} key={template.id} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{template.name}</Card.Title>
                    <Card.Text>
                      <strong>Semester:</strong> {template.semester}
                      <br />
                      <strong>Duration:</strong> {template.weeks} weeks
                      <br />
                      <strong>Assignments:</strong> {template.assignments}
                      <br />
                      <strong>Exams:</strong> {template.exams}
                      <br />
                      <strong>Labs:</strong> {template.labs}
                      <br />
                      <strong>Projects:</strong> {template.projects}
                    </Card.Text>
                    <Button variant="outline-primary" size="sm">
                      Edit Template
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </>
    );
  }

  // Form view
  return (
    <>
      <Button
        variant="secondary"
        className="mb-3"
        onClick={() => setShowForm(false)}
      >
        ← Back to Templates
      </Button>

      <h1>Create a Course Template</h1>

      {showAlert && (
        <Alert
          variant="success"
          onClose={() => setShowAlert(false)}
          dismissible
        >
          ✅ Template created successfully!
        </Alert>
      )}

      <Form className="course-form" onSubmit={handleSubmit}>
        <Row>
          <Col>
            <Form.Group id="formTemplateName">
              <Form.Label>Template Name: </Form.Label>
              <Form.Control
                type="text"
                required
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="ex. Standard SE Course Template"
              />
            </Form.Group>
          </Col>

          <Col>
            <Form.Group id="formSemester">
              <Form.Label>Semester: </Form.Label>
              <Form.Control
                type="text"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="ex. Fall"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group id="formNumWeeks">
              <Form.Label>Number of Weeks: </Form.Label>
              <Form.Control
                type="number"
                required
                value={numWeeks}
                onChange={(e) => setNumWeeks(e.target.value)}
                placeholder="ex. 15"
              />
            </Form.Group>
          </Col>

          <Col>
            <Form.Group id="formNumAssignments">
              <Form.Label>Number of Assignments: </Form.Label>
              <Form.Control
                type="number"
                required
                value={numAssignments}
                onChange={(e) => setNumAssignments(e.target.value)}
                placeholder="ex. 10"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group id="formNumExams">
              <Form.Label>Number of Exams: </Form.Label>
              <Form.Control
                type="number"
                required
                value={numExams}
                onChange={(e) => setNumExams(e.target.value)}
                placeholder="ex. 3"
              />
            </Form.Group>
          </Col>

          <Col>
            <Form.Group id="formNumLabs">
              <Form.Label>Number of Labs: </Form.Label>
              <Form.Control
                type="number"
                required
                value={numLabs}
                onChange={(e) => setNumLabs(e.target.value)}
                placeholder="ex. 12"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group id="formNumProjects">
              <Form.Label>Number of Project Deadlines: </Form.Label>
              <Form.Control
                type="number"
                required
                value={numProjects}
                onChange={(e) => setNumProjects(e.target.value)}
                placeholder="ex. 4"
              />
            </Form.Group>
          </Col>
        </Row>

        <div id="button-wrapper">
          <Button id="form-button" type="submit">
            Create Template
          </Button>
        </div>
      </Form>
    </>
  );
}

export default CreateTemplatePage;
