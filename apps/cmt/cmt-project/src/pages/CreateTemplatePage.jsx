import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import "../styles/course.css";
import { API_BASE } from "../utils/api";

function CreateTemplatePage() {
  const [showForm, setShowForm] = useState(false);
  const [showDateConfig, setShowDateConfig] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [semester, setSemester] = useState("");
  const [numWeeks, setNumWeeks] = useState("");
  const [numAssignments, setNumAssignments] = useState("");
  const [numExams, setNumExams] = useState("");
  const [numLabs, setNumLabs] = useState("");
  const [numProjects, setNumProjects] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Fetch existing templates when component loads
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/template/professor/1`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setSemester(template.semester);
    setNumWeeks(template.weeks.toString());
    setNumAssignments(template.assignments.toString());
    setNumExams(template.exams.toString());
    setNumLabs(template.labs.toString());
    setNumProjects(template.projects.toString());
    setShowForm(true);
  };

  const handleConfigureDates = (template) => {
    setSelectedTemplate(template);
    setShowDateConfig(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/template/${templateId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      setAlertMessage("Template deleted successfully!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      fetchTemplates();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const templateData = {
        name: templateName,
        semester: semester,
        weeks: numWeeks,
        assignments: numAssignments,
        exams: numExams,
        labs: numLabs,
        projects: numProjects,
        professorId: 1,
      };

      let templateResponse;

      if (editingTemplate) {
        templateResponse = await fetch(
          `${API_BASE}/template/${editingTemplate.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateData),
            credentials: 'include',
          }
        );
        setAlertMessage("Template updated successfully!");
      } else {
        templateResponse = await fetch(`${API_BASE}/template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData),
          credentials: 'include',
        });
        setAlertMessage("Template created successfully!");
      }

      if (!templateResponse.ok) {
        throw new Error("Failed to save template");
      }

      const responseData = await templateResponse.json();
      console.log("Template saved: ", responseData);

      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      setTemplateName("");
      setSemester("");
      setNumWeeks("");
      setNumAssignments("");
      setNumExams("");
      setNumLabs("");
      setNumProjects("");
      setEditingTemplate(null);

      fetchTemplates();
      setShowForm(false);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleCancel = () => {
    setTemplateName("");
    setSemester("");
    setNumWeeks("");
    setNumAssignments("");
    setNumExams("");
    setNumLabs("");
    setNumProjects("");
    setEditingTemplate(null);
    setShowForm(false);
  };

  // Date Configuration View
  if (showDateConfig && selectedTemplate) {
    return (
      <DateConfigView
        template={selectedTemplate}
        onBack={() => {
          setShowDateConfig(false);
          setSelectedTemplate(null);
        }}
        onSave={() => {
          setAlertMessage("Dates configured successfully!");
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 6000);
          setShowDateConfig(false);
          setSelectedTemplate(null);
        }}
        apiBase={API_BASE}
      />
    );
  }

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
            ✅ {alertMessage}
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
                    <div className="d-flex gap-2 flex-wrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfigureDates(template)}
                      >
                        Configure Dates
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        Edit Template
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
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
      <Button variant="secondary" className="mb-3" onClick={handleCancel}>
        ← Back to Templates
      </Button>

      <h1>{editingTemplate ? "Edit Template" : "Create a Course Template"}</h1>

      {showAlert && (
        <Alert
          variant="success"
          onClose={() => setShowAlert(false)}
          dismissible
        >
          ✅ {alertMessage}
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
            {editingTemplate ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </Form>
    </>
  );
}

// Date Configuration Component
function DateConfigView({ template, onBack, onSave, apiBase }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    initializeItems();
    loadExistingItems();
  }, []);

  const initializeItems = () => {
    const newItems = [];

    // Create assignment items
    for (let i = 1; i <= template.assignments; i++) {
      newItems.push({
        type: "assignment",
        name: `Assignment ${i}`,
        dueDate: "",
        description: "",
      });
    }

    // Create exam items
    for (let i = 1; i <= template.exams; i++) {
      newItems.push({
        type: "exam",
        name: `Exam ${i}`,
        dueDate: "",
        description: "",
      });
    }

    // Create lab items
    for (let i = 1; i <= template.labs; i++) {
      newItems.push({
        type: "lab",
        name: `Lab ${i}`,
        dueDate: "",
        description: "",
      });
    }

    // Create project items
    for (let i = 1; i <= template.projects; i++) {
      newItems.push({
        type: "project",
        name: `Project ${i}`,
        dueDate: "",
        description: "",
      });
    }

    setItems(newItems);
  };

  const loadExistingItems = async () => {
    try {
      const response = await fetch(`${apiBase}/template/${template.id}/items`, {
        credentials: 'include',
      });
      if (response.ok) {
        const existingItems = await response.json();
        if (existingItems.length > 0) {
          setItems(
            existingItems.map((item) => ({
              ...item,
              dueDate: item.dueDate
                ? new Date(item.dueDate).toISOString().split("T")[0]
                : "",
            }))
          );
        }
      }
    } catch (err) {
      console.error("Error loading existing items:", err);
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiBase}/template/${template.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to save dates");
      }

      onSave();
    } catch (err) {
      console.error("Error saving dates:", err);
      alert("Failed to save dates. Please try again.");
    }
  };

  const groupedItems = {
    assignment: items.filter((item) => item.type === "assignment"),
    exam: items.filter((item) => item.type === "exam"),
    lab: items.filter((item) => item.type === "lab"),
    project: items.filter((item) => item.type === "project"),
  };

  return (
    <>
      <Button variant="secondary" className="mb-3" onClick={onBack}>
        ← Back to Templates
      </Button>

      <h1>Configure Dates for {template.name}</h1>
      <p className="text-muted">Set due dates and descriptions for each item</p>

      <Form>
        {Object.entries(groupedItems).map(([type, typeItems]) =>
          typeItems.length > 0 ? (
            <div key={type} className="mb-4">
              <h3 className="text-capitalize">{type}s</h3>
              {typeItems.map((item, idx) => {
                const globalIndex = items.findIndex(
                  (i) => i.type === type && i.name === item.name
                );
                return (
                  <Card key={idx} className="mb-3">
                    <Card.Body>
                      <Row>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                updateItem(globalIndex, "name", e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Due Date</Form.Label>
                            <Form.Control
                              type="date"
                              value={item.dueDate}
                              onChange={(e) =>
                                updateItem(
                                  globalIndex,
                                  "dueDate",
                                  e.target.value
                                )
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Description (Optional)</Form.Label>
                            <Form.Control
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(
                                  globalIndex,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Brief description..."
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          ) : null
        )}

        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleSave}>
            Save Dates
          </Button>
          <Button variant="secondary" onClick={onBack}>
            Cancel
          </Button>
        </div>
      </Form>
    </>
  );
}

export default CreateTemplatePage;