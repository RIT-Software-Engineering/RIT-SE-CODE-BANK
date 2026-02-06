import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Modal, ProgressBar } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import {
  Plus,
  Trash2,
  List as ListIcon,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import "../styles/course.css";
import { API_BASE } from "../utils/api";

function CoursePage() {
  // View state
  const [view, setView] = useState("list"); // 'list' or 'create'
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-step workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState({
    id: 0,
    classId: "",
    name: "",
    semester: "",
    color: "",
    students: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");

  // Onboarding modal state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/events/courses`, {
        credentials: 'include', // Send cookies
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const result = await response.json();

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

  // Reset workflow state
  const resetWorkflow = () => {
    setCurrentStep(1);
    setCourseData({
      id: 0,
      classId: "",
      name: "",
      semester: "",
      color: "",
      students: "",
    });
    setSelectedTemplate(null);
    setCalendarEvents([]);
  };

  // Handle starting course creation
  const handleStartCreate = () => {
    resetWorkflow();
    setView("create");
  };

  // Handle course deletion
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`${API_BASE}/course/${courseId}`, {
        method: "DELETE",
        credentials: 'include', // Send cookies
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
          <Button variant="primary" onClick={handleStartCreate}>
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
                  {course.classId}
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
            <Button variant="primary" onClick={handleStartCreate}>
              <Plus size={20} /> Create New Course
            </Button>
          </div>
          {renderCourseList()}
        </div>
      ) : (
        <CourseCreationWorkflow
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          courseData={courseData}
          setCourseData={setCourseData}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          calendarEvents={calendarEvents}
          setCalendarEvents={setCalendarEvents}
          onComplete={() => {
            resetWorkflow();
            setView("list");
            fetchCourses();
            setAlertVariant("success");
            setAlertMessage("✅ Course created successfully!");
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 6000);
          }}
          onCancel={() => {
            resetWorkflow();
            setView("list");
          }}
        />
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

// Multi-step Course Creation Workflow Component
function CourseCreationWorkflow({
  currentStep,
  setCurrentStep,
  courseData,
  setCourseData,
  selectedTemplate,
  setSelectedTemplate,
  calendarEvents,
  setCalendarEvents,
  onComplete,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { number: 1, title: "Course Details", icon: "📋" },
    { number: 2, title: "Select Template", icon: "📑" },
    { number: 3, title: "Calendar Events", icon: "📅" },
  ];

  const handleNext = () => {
    if (currentStep === 1 && !validateCourseDetails()) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateCourseDetails = () => {
    if (!courseData.id || !courseData.name || !courseData.semester || !courseData.color || !courseData.students) {
      setError("Please fill in all required fields");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call backend API to create course with all data
      const response = await fetch(`${API_BASE}/course/create-with-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Send cookies
        body: JSON.stringify({
          course: {
            id: courseData.id,
            name: courseData.name,
            semester: courseData.semester,
            color: courseData.color,
            students: courseData.students,
            professorId: 1, // TODO: Replace with real professorId
          },
          templateId: selectedTemplate,
          calendarEvents: calendarEvents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create course");
      }

      const result = await response.json();

      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      setError("Failed to create course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="course-creation-workflow">
      <div className="workflow-header">
        <h1>Create a New Course</h1>
        <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="workflow-progress">
        <ProgressBar now={progress} className="mb-3" />
        <div className="steps-indicator">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`step-item ${currentStep === step.number ? "active" : ""} ${
                currentStep > step.number ? "completed" : ""
              }`}
            >
              <div className="step-icon">
                {currentStep > step.number ? <Check size={20} /> : step.icon}
              </div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <div className="workflow-content">
        {currentStep === 1 && (
          <CourseDetailsStep courseData={courseData} setCourseData={setCourseData} />
        )}
        {currentStep === 2 && (
          <TemplateSelectionStep
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        )}
        {currentStep === 3 && (
          <CalendarEventsStep
            calendarEvents={calendarEvents}
            setCalendarEvents={setCalendarEvents}
            courseData={courseData}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="workflow-navigation">
        {currentStep > 1 && (
          <Button variant="outline-secondary" onClick={handleBack} disabled={loading}>
            <ArrowLeft size={16} /> Back
          </Button>
        )}
        <div className="spacer" />
        {currentStep < steps.length ? (
          <Button variant="primary" onClick={handleNext} disabled={loading}>
            Next <ArrowRight size={16} />
          </Button>
        ) : (
          <Button variant="success" onClick={handleFinish} disabled={loading}>
            {loading ? "Creating..." : "Create Course"} <Check size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Course Details Form
function CourseDetailsStep({ courseData, setCourseData }) {
  const handleChange = (field, value) => {
    setCourseData({ ...courseData, [field]: value });
  };

  return (
    <div className="step-content course-details-step">
      <h3>📋 Course Information</h3>
      <p className="step-description">Enter the basic details for your course</p>

      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course ID *</Form.Label>
              <Form.Control
                type="text"
                required
                value={courseData.id}
                onChange={(e) => handleChange("id", e.target.value)}
                placeholder="e.g., SWEN101"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={courseData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Freshman Seminar"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Semester *</Form.Label>
              <Form.Control
                type="text"
                required
                value={courseData.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                placeholder="e.g., Fall 2025"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Number of Students *</Form.Label>
              <Form.Control
                type="number"
                required
                value={courseData.students}
                onChange={(e) => handleChange("students", e.target.value)}
                placeholder="e.g., 30"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course Color *</Form.Label>
              <Form.Select
                required
                value={courseData.color}
                onChange={(e) => handleChange("color", e.target.value)}
              >
                <option value="">Select a color...</option>
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
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Upload Syllabus (Optional)</Form.Label>
              <Form.Control type="file" />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

// Step 2: Template Selection
function TemplateSelectionStep({ selectedTemplate, setSelectedTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // Use existing template endpoint - get templates for professor
      const professorId = 1; // TODO: Replace with real professorId
      const response = await fetch(`${API_BASE}/template/professor/${professorId}`, {
        credentials: 'include', // Send cookies
      });
      if (!response.ok) throw new Error("Failed to fetch templates");
      const templatesData = await response.json();

      // Transform to match expected format
      setTemplates(templatesData.map(template => ({
        id: template.id,
        name: template.name,
        description: `${template.semester} - ${template.weeks} weeks, ${template.assignments} assignments, ${template.exams} exams, ${template.labs} labs, ${template.projects} projects`,
        icon: '📋',
        eventsCount: template.assignments + template.exams + template.labs + template.projects
      })));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading templates...</div>;
  }

  return (
    <div className="step-content template-selection-step">
      <h3>📑 Choose a Template (Optional)</h3>
      <p className="step-description">
        Select a pre-made template to quickly set up your course, or skip to start from scratch
      </p>

      <div className="template-options">
        <Card
          className={`template-card ${selectedTemplate === null ? "selected" : ""}`}
          onClick={() => setSelectedTemplate(null)}
        >
          <Card.Body>
            <div className="template-icon">📝</div>
            <Card.Title>Start from Scratch</Card.Title>
            <Card.Text>Create a completely custom course without any template</Card.Text>
          </Card.Body>
        </Card>

        {templates.map((template) => (
          <Card
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? "selected" : ""}`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <Card.Body>
              <div className="template-icon">{template.icon || "📋"}</div>
              <Card.Title>{template.name}</Card.Title>
              <Card.Text>{template.description}</Card.Text>
              {template.eventsCount && (
                <div className="template-stats">
                  <small>{template.eventsCount} calendar events included</small>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Step 3: Calendar Events
function CalendarEventsStep({ calendarEvents, setCalendarEvents }) {
  const handleAddEvent = () => {
    setCalendarEvents([
      ...calendarEvents,
      {
        id: `temp-${Date.now()}`,
        title: "",
        date: "",
        time: "",
        description: "",
      },
    ]);
  };

  const handleRemoveEvent = (index) => {
    setCalendarEvents(calendarEvents.filter((_, i) => i !== index));
  };

  const handleEventChange = (index, field, value) => {
    const updated = [...calendarEvents];
    updated[index][field] = value;
    setCalendarEvents(updated);
  };

  return (
    <div className="step-content calendar-events-step">
      <h3>📅 Add Calendar Events (Optional)</h3>
      <p className="step-description">
        Add important dates and deadlines for your course. You can always add more later.
      </p>

      {calendarEvents.length === 0 ? (
        <div className="empty-state-small">
          <p>No events added yet. Click &quot;Add Event&quot; to create your first calendar event.</p>
        </div>
      ) : (
        <div className="events-list">
          {calendarEvents.map((event, index) => (
            <Card key={event.id || index} className="event-card mb-3">
              <Card.Body>
                <div className="event-header">
                  <span className="event-number">Event {index + 1}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveEvent(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Event Title *</Form.Label>
                      <Form.Control
                        type="text"
                        value={event.title}
                        onChange={(e) => handleEventChange(index, "title", e.target.value)}
                        placeholder="e.g., Midterm Exam"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={event.date}
                        onChange={(e) => handleEventChange(index, "date", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={event.time}
                        onChange={(e) => handleEventChange(index, "time", e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={event.description}
                        onChange={(e) => handleEventChange(index, "description", e.target.value)}
                        placeholder="Additional details about this event..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline-primary" onClick={handleAddEvent}>
        <Plus size={16} /> Add Event
      </Button>
    </div>
  );
}

// Onboarding Workflow Editor Component
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

  useEffect(() => {
    if (course?.workflowId) {
      loadExistingWorkflow();
    }
  }, [course]);

  const loadExistingWorkflow = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(
        `${API_BASE}/workflows/course/${course.id}/actions`,
        {
          credentials: 'include', // Send cookies
        }
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
    const validActions = actions.filter((a) => a.title.trim() !== "");

    if (validActions.length === 0) {
      setError("Please add at least one action");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/workflows/course/${course.id}/onboarding`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Send cookies
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