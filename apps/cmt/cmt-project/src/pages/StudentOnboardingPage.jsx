import React, { useState, useEffect } from "react";
import { Card, ProgressBar, Form, Button, Badge, Alert } from "react-bootstrap";
import {
  CheckCircle,
  Circle,
  BookOpen,
  Calendar,
  Users,
  FileText,
  Award,
} from "lucide-react";
import "../styles/studentonboarding.css";

function StudentOnboardingPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = `${process.env.REACT_APP_BACKEND_URL}`;
  const WORKFLOWS_API = "http://localhost:5001";

  // TODO: Replace with actual student ID from authentication
  const TEMP_STUDENT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

  useEffect(() => {
    loadStudentWorkflows();
  }, []);

  const loadStudentWorkflows = async () => {
    try {
      setLoading(true);

      // Step 1: Get all courses (not just enrolled ones)
      const coursesResponse = await fetch(`${API_BASE}/events/courses`);
      const coursesData = await coursesResponse.json();
      const courses = coursesData.success ? coursesData.data : [];

      // Step 2: Filter courses that have workflows
      const coursesWithWorkflows = courses.filter((c) => c.workflowId);

      console.log("Courses with workflows:", coursesWithWorkflows);

      if (coursesWithWorkflows.length === 0) {
        setWorkflows([]);
        setLoading(false);
        return;
      }

      // Step 3: Load workflow data for each course
      const workflowPromises = coursesWithWorkflows.map(async (course) => {
        try {
          // Get workflow details
          const workflowResponse = await fetch(
            `${WORKFLOWS_API}/workflows/${course.workflowId}`
          );

          if (!workflowResponse.ok) {
            console.error(`Workflow ${course.workflowId} not found`);
            return null;
          }

          const workflow = await workflowResponse.json();

          // Get workflow actions
          const actionsResponse = await fetch(
            `${WORKFLOWS_API}/actions?workflowId=${course.workflowId}`
          );
          const actions = await actionsResponse.json();

          if (!actions || actions.length === 0) {
            console.warn(`No actions found for workflow ${course.workflowId}`);
            return null;
          }

          // Get or create workflow state for this student
          const state = await getOrCreateWorkflowState(
            course.workflowId,
            TEMP_STUDENT_ID
          );

          if (!state || !state.actionStates) {
            console.error(`Invalid workflow state for ${course.name}`, state);
            return null;
          }

          const completed = state.actionStates.filter(
            (s) => s.stateType === "completed"
          ).length;
          const total = state.actionStates.length;

          return {
            course,
            workflow,
            actions,
            state,
            completed,
            total,
          };
        } catch (error) {
          console.error(`Error loading workflow for ${course.name}:`, error);
          return null;
        }
      });

      const workflowData = await Promise.all(workflowPromises);
      setWorkflows(workflowData.filter((w) => w !== null));
      setLoading(false);
    } catch (error) {
      console.error("Error loading student workflows:", error);
      setError("Failed to load your onboarding checklists");
      setLoading(false);
    }
  };

  const getOrCreateWorkflowState = async (workflowId, userId) => {
    try {
      console.log("Creating workflow state for:", workflowId, userId);

      const response = await fetch(`${WORKFLOWS_API}/states/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          workflowId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to create workflow state:",
          response.status,
          errorText
        );
        throw new Error(`Failed to create workflow state: ${response.status}`);
      }

      const workflowState = await response.json();
      console.log(
        "Workflow state created:",
        JSON.stringify(workflowState, null, 2)
      );

      // Now fetch the action states for this workflow state
      const actionStatesResponse = await fetch(
        `${WORKFLOWS_API}/states/workflow/${workflowState.id}`
      );

      if (!actionStatesResponse.ok) {
        throw new Error("Failed to fetch action states");
      }

      const fullState = await actionStatesResponse.json();
      console.log(
        "Full workflow state with action states:",
        JSON.stringify(fullState, null, 2)
      );

      // The structure has actionStates nested in baseActionState.children
      if (
        !fullState.baseActionState ||
        !fullState.baseActionState.children ||
        !Array.isArray(fullState.baseActionState.children)
      ) {
        console.error(
          "BaseActionState.children missing or not an array:",
          fullState
        );
        throw new Error(
          "Invalid workflow state structure - baseActionState.children missing"
        );
      }

      // Transform the structure to have a top-level actionStates array
      fullState.actionStates = fullState.baseActionState.children;

      return fullState;
    } catch (error) {
      console.error("Error creating workflow state:", error);
      throw error;
    }
  };

  const handleActionToggle = async (
    workflowIndex,
    actionStateId,
    currentState
  ) => {
    try {
      const newState =
        currentState === "completed" ? "notStarted" : "completed";

      // Update action state via Workflows API
      await fetch(`${WORKFLOWS_API}/states/action/${actionStateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateType: newState,
        }),
      });

      // Reload workflows to get updated state
      await loadStudentWorkflows();
    } catch (error) {
      console.error("Error updating action state:", error);
      setError("Failed to update checklist item");
    }
  };

  const getIconForAction = (actionName) => {
    const name = actionName.toLowerCase();
    if (name.includes("syllabus") || name.includes("review"))
      return <BookOpen size={18} />;
    if (name.includes("calendar") || name.includes("date"))
      return <Calendar size={18} />;
    if (name.includes("join") || name.includes("communication"))
      return <Users size={18} />;
    if (name.includes("assignment") || name.includes("complete"))
      return <FileText size={18} />;
    return <Circle size={18} />;
  };

  const getOverallProgress = () => {
    if (workflows.length === 0) return 0;
    const totalCompleted = workflows.reduce((sum, w) => sum + w.completed, 0);
    const totalActions = workflows.reduce((sum, w) => sum + w.total, 0);
    return totalActions > 0
      ? Math.round((totalCompleted / totalActions) * 100)
      : 0;
  };

  if (loading) {
    return (
      <div className="student-onboarding-page">
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your onboarding checklists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-onboarding-page">
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="student-onboarding-page">
        <div className="empty-state">
          <Award size={64} />
          <h2>All Caught Up!</h2>
          <p>You don't have any onboarding tasks right now.</p>
          <p className="text-muted">
            New checklists will appear here when you enroll in courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-onboarding-page">
      <div className="page-header">
        <div>
          <h1>My Onboarding</h1>
          <p className="subtitle">
            Complete these tasks to get started in your courses
          </p>
        </div>
        <div className="overall-progress">
          <div className="progress-label">
            <span>Overall Progress</span>
            <span className="progress-percentage">{getOverallProgress()}%</span>
          </div>
          <ProgressBar
            now={getOverallProgress()}
            variant={getOverallProgress() === 100 ? "success" : "primary"}
            className="overall-progress-bar"
          />
        </div>
      </div>

      <div className="workflows-container">
        {workflows.map((workflow, workflowIndex) => (
          <Card key={workflow.course.id} className="workflow-card">
            <Card.Header className="workflow-header">
              <div className="course-info">
                <div
                  className="course-badge"
                  style={{ backgroundColor: workflow.course.color }}
                >
                  {workflow.course.id}
                </div>
                <div>
                  <h3>{workflow.course.name}</h3>
                  <span className="semester-badge">
                    {workflow.course.semester}
                  </span>
                </div>
              </div>
              <div className="progress-info">
                <span className="completion-count">
                  {workflow.completed} / {workflow.total} completed
                </span>
                <ProgressBar
                  now={(workflow.completed / workflow.total) * 100}
                  variant={
                    workflow.completed === workflow.total ? "success" : "info"
                  }
                  className="workflow-progress-bar"
                />
              </div>
            </Card.Header>

            <Card.Body>
              <div className="actions-checklist">
                {workflow.state.actionStates.map((actionState, actionIndex) => {
                  const action = actionState.action; // Action is nested inside actionState
                  const isCompleted = actionState.stateType === "completed";

                  return (
                    <div
                      key={actionState.id}
                      className={`checklist-item ${
                        isCompleted ? "completed" : ""
                      }`}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`action-${actionState.id}`}
                        checked={isCompleted}
                        onChange={() =>
                          handleActionToggle(
                            workflowIndex,
                            actionState.id,
                            actionState.stateType
                          )
                        }
                        className="action-checkbox"
                      />
                      <div className="action-content">
                        <div className="action-icon">
                          {isCompleted ? (
                            <CheckCircle size={20} className="completed-icon" />
                          ) : (
                            getIconForAction(action.name)
                          )}
                        </div>
                        <div className="action-details">
                          <div className="action-title">{action.name}</div>
                          {action.description && (
                            <div className="action-description">
                              {action.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="action-number">{actionIndex + 1}</div>
                    </div>
                  );
                })}
              </div>

              {workflow.completed === workflow.total && (
                <div className="completion-badge">
                  <Award size={20} />
                  <span>Course Onboarding Complete!</span>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default StudentOnboardingPage;
