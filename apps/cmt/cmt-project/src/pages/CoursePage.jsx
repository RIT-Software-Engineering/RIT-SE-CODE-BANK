import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import "../styles/course.css";

function CoursePage() {
import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Modal } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import {
  Plus,
  Edit,
  Trash2,
  List as ListIcon,
  CheckSquare,
} from "lucide-react";
import "../styles/course.css";

function CoursePage() {
  // View state
  const [view, setView] = useState("list"); // 'list' or 'create'
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [color, setColor] = useState("");
  const [numOfStudents, setStudents] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");

  // Onboarding modal state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5010/api';

  const API_BASE = `${process.env.REACT_APP_BACKEND_URL}`;
  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/events/courses`);
      if (!response.ok) throw new Error("Failed to fetch courses");
      const result = await response.json();

      // Handle the response format: { success: true, data: [...] }
      if (result.success && result.data) {
        setCourses(result.data);
      } else {
        setCourses([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setLoading(false);
    }
  };

  // Handle course creation
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const courseResponse = await fetch(`${API_BASE}/course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: courseId,
          name: courseName,
          semester: semester,
          color: color,
          students: numOfStudents,
          professorId: 1, // TODO: REPLACE WITH REAL PROFESSORID
        }),
      });

      if (!courseResponse.ok) {
        throw new Error("Failed to create a new course");
      }

      const courseData = await courseResponse.json();
      console.log("New course created: ", courseData);

      setAlertVariant("success");
      setAlertMessage("✅ Course created successfully!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      // Clear form and refresh courses
      setCourseId("");
      setCourseName("");
      setColor("");
      setStudents("");
      setSemester("");

      fetchCourses();
      setView("list"); // Return to list view
    } catch (err) {
      console.error(err.message);
      setAlertVariant("danger");
      setAlertMessage("❌ Failed to create course");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);
    }
  };

  // TODO nothing happens with the syllabus upload yet
  return (
    <>
      <h1>Create a course</h1>

      {showAlert && (
        <Alert
          variant="success"
          onClose={() => setShowAlert(false)}
          dismissible
        >
          ✅ Course created successfully!
        </Alert>
      )}
      <Form className="course-form" onSubmit={handleSubmit}>
        <Row>
          <Col>
            <Form.Group id="formCourseCode">
              <Form.Label>Course ID: </Form.Label>
              <Form.Control
                type="text"
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="ex. Swen101"
              ></Form.Control>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group id="formCourseName">
              <Form.Label>Course Name: </Form.Label>
              <Form.Control
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="ex. Freshmen Seminar"
              ></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group id="formNumOfStudents">
              <Form.Label>Number of students: </Form.Label>
              <Form.Control
                type="number"
                required
                value={numOfStudents}
                onChange={(e) => setStudents(e.target.value)}
                placeholder="ex. 15"
              ></Form.Control>
  // Handle course deletion
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`${API_BASE}/course/${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete course");

      setAlertVariant("success");
      setAlertMessage("✅ Course deleted successfully!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      setAlertVariant("danger");
      setAlertMessage("❌ Failed to delete course");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);
    }
  };

  // Open onboarding editor
  const handleEditOnboarding = (course) => {
    setSelectedCourse(course);
    setShowOnboardingModal(true);
  };

  // Get color class for course badge
  const getColorClass = (color) => {
    return `course-badge-${color}`;
  };

  // Render course list view
  const renderCourseList = () => {
    if (loading) {
      return <div className="loading">Loading courses...</div>;
    }

    if (courses.length === 0) {
      return (
        <div className="empty-state">
          <ListIcon size={48} />
          <h3>No Courses Yet</h3>
          <p>Create your first course to get started!</p>
          <Button variant="primary" onClick={() => setView("create")}>
            <Plus size={20} /> Create First Course
          </Button>
        </div>
      );
    }

    return (
      <div className="courses-grid">
        {courses.map((course) => (
          <Card key={course.id} className="course-card">
            <Card.Body>
              <div className="course-header">
                <span className={`course-badge ${getColorClass(course.color)}`}>
                  {course.id}
                </span>
                <div className="course-actions">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEditOnboarding(course)}
                    title="Edit Onboarding Workflow"
                  >
                    <CheckSquare size={16} />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.id)}
                    title="Delete Course"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <Card.Title>{course.name}</Card.Title>

              <div className="course-details">
                <div className="course-detail-item">
                  <strong>Semester:</strong> {course.semester}
                </div>
                <div className="course-detail-item">
                  <strong>Students:</strong> {course.students}
                </div>
              </div>

              {course.workflowId && (
                <div className="onboarding-status">✓ Onboarding Configured</div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  // Render create course form
  const renderCreateForm = () => {
    return (
      <div className="create-course-container">
        <div className="form-header">
          <h1>Create a Course</h1>
          <Button variant="outline-secondary" onClick={() => setView("list")}>
            ← Back to Courses
          </Button>
        </div>

        <Form className="course-form" onSubmit={handleSubmit}>
          <Row>
            <Col>
              <Form.Group id="formCourseCode">
                <Form.Label>Course ID: </Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="ex. Swen101"
                />
              </Form.Group>
            </Col>

            <Col>
              <Form.Group id="formCourseName">
                <Form.Label>Course Name: </Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="ex. Freshmen Seminar"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col>
              <Form.Group id="formNumOfStudents">
                <Form.Label>Number of students: </Form.Label>
                <Form.Control
                  type="number"
                  required
                  value={numOfStudents}
                  onChange={(e) => setStudents(e.target.value)}
                  placeholder="ex. 15"
                />
              </Form.Group>
            </Col>

            <Col>
              <Form.Group id="formCourseSemester">
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
            <Form.Group id="formCourseColor">
              <Form.Label>Select a color: </Form.Label>
              <Form.Select
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
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

          <Col>
            <Form.Group id="formCourseSemester">
              <Form.Label>Semester: </Form.Label>
              <Form.Control
                type="text"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="ex. Fall"
              ></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Form.Group id="formCourseColor">
            <Form.Label>Select a color: </Form.Label>
            <Form.Select
              requried
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
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
            <Form.Control type="file"></Form.Control>
          </Form.Group>
        </Row>

        <div id="button-wrapper">
          <Button id="form-button" type="submit">
            Create Course
          </Button>
        </div>
      </Form>
    </>
          <Row>
            <Form.Group id="formFile">
              <Form.Label>Upload Syllabus</Form.Label>
              <Form.Control type="file" />
            </Form.Group>
          </Row>

          <div id="button-wrapper">
            <Button id="form-button" type="submit">
              Create Course
            </Button>
          </div>
        </Form>
      </div>
    );
  };

  return (
    <div className="course-page">
      {showAlert && (
        <Alert
          variant={alertVariant}
          onClose={() => setShowAlert(false)}
          dismissible
          className="course-alert"
        >
          {alertMessage}
        </Alert>
      )}

      {view === "list" ? (
        <div className="course-list-view">
          <div className="list-header">
            <h1>My Courses</h1>
            <Button variant="primary" onClick={() => setView("create")}>
              <Plus size={20} /> Create New Course
            </Button>
          </div>
          {renderCourseList()}
        </div>
      ) : (
        renderCreateForm()
      )}

      {/* Onboarding Workflow Editor Modal */}
      <Modal
        show={showOnboardingModal}
        onHide={() => setShowOnboardingModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Student Onboarding: {selectedCourse?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OnboardingWorkflowEditor
            course={selectedCourse}
            onSave={() => {
              setShowOnboardingModal(false);
              fetchCourses();
              setAlertVariant("success");
              setAlertMessage("✅ Onboarding workflow saved!");
              setShowAlert(true);
              setTimeout(() => setShowAlert(false), 6000);
            }}
            onCancel={() => setShowOnboardingModal(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

// Onboarding Workflow Editor Component - NOW USES BACKEND API
function OnboardingWorkflowEditor({ course, onSave, onCancel }) {
  const [actions, setActions] = useState([
    { 
      id: "temp-1", 
      title: "Review Syllabus", 
      description: "", 
      linkType: "none",
      linkUrl: "",
      order: 1 
    },
    {
      id: "temp-2",
      title: "Add Important Dates to Calendar",
      description: "",
      linkType: "none",
      linkUrl: "",
      order: 2,
    },
    {
      id: "temp-3",
      title: "Join Course Communication Channel",
      description: "",
      linkType: "none",
      linkUrl: "",
      order: 3,
    },
    {
      id: "temp-4",
      title: "Complete Intro Assignment",
      description: "",
      linkType: "none",
      linkUrl: "",
      order: 4,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5010/api';

  // Load existing workflow actions if course has a workflow
  useEffect(() => {
    if (course?.workflowId) {
      loadExistingWorkflow();
    }
  }, [course]);

  const loadExistingWorkflow = async () => {
    setLoadingData(true);
    try {
      // NOW: Call backend API instead of workflowService
      const response = await fetch(
        `${API_BASE}/workflows/course/${course.id}/actions`
      );

      if (!response.ok) {
        throw new Error('Failed to load workflow');
      }

      const result = await response.json();

      if (result.success && result.data.length > 0) {
        setActions(result.data);
      }
    } catch (error) {
      console.error("Error loading workflow:", error);
      setError("Failed to load existing workflow");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        id: `temp-${Date.now()}`,
        title: "",
        description: "",
        linkType: "none",
        linkUrl: "",
        order: actions.length + 1,
      },
    ]);
  };

  const handleRemoveAction = (index) => {
    const updated = actions.filter((_, i) => i !== index);
    setActions(updated);
  };

  const handleActionChange = (index, field, value) => {
    const updated = [...actions];
    updated[index][field] = value;
    setActions(updated);
  };

  const handleSave = async () => {
    // Validate actions
    const validActions = actions.filter((a) => a.title.trim() !== "");

    if (validActions.length === 0) {
      setError("Please add at least one action");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // NOW: Call backend API instead of workflowService
      const response = await fetch(
        `${API_BASE}/workflows/course/${course.id}/onboarding`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actions: validActions })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      const result = await response.json();

      if (result.success) {
        onSave();
      } else {
        setError(result.error || "Failed to save workflow");
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      setError("Failed to save workflow. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="onboarding-editor">
        <div className="loading-state">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="onboarding-editor">
      <p className="editor-description">
        Create a checklist of tasks that students should complete when they
        first enroll in this course.
      </p>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="actions-list">
        {actions.map((action, index) => (
          <div key={action.id || index} className="action-item">
            <span className="action-number">{index + 1}</span>
            
            <div className="action-inputs">
              <input
                type="text"
                className="action-title"
                value={action.title}
                onChange={(e) =>
                  handleActionChange(index, "title", e.target.value)
                }
                placeholder="Action title..."
              />
              
              <div className="link-options">
                <select
                  className="link-type-select"
                  value={action.linkType || "none"}
                  onChange={(e) =>
                    handleActionChange(index, "linkType", e.target.value)
                  }
                >
                  <option value="none">No Link</option>
                  <option value="internal">Internal CMT Page</option>
                  <option value="external">External URL</option>
                </select>
                
                {action.linkType !== "none" && (
                  <>
                    {action.linkType === "internal" ? (
                      <select
                        className="link-url-input"
                        value={action.linkUrl || ""}
                        onChange={(e) =>
                          handleActionChange(index, "linkUrl", e.target.value)
                        }
                      >
                        <option value="">Select page...</option>
                        <option value="/cmt/calendar">Calendar</option>
                        <option value="/cmt/team-builder">Team Builder</option>
                        <option value="/cmt/course-builder">Course Builder</option>
                        <option value="/cmt/onboarding">My Onboarding</option>
                      </select>
                    ) : (
                      <input
                        type="url"
                        className="link-url-input"
                        value={action.linkUrl || ""}
                        onChange={(e) =>
                          handleActionChange(index, "linkUrl", e.target.value)
                        }
                        placeholder="https://example.com"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleRemoveAction(index)}
              disabled={actions.length === 1}
              title="Remove action"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline-primary"
        onClick={handleAddAction}
        disabled={loading}
      >
        <Plus size={16} /> Add Action
      </Button>

      <div className="editor-actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Workflow"}
        </Button>
      </div>
    </div>
  );
}

export default CoursePage;