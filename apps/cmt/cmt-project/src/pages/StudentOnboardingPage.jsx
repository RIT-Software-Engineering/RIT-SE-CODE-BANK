import React, { useState, useEffect } from "react";
import { Card, ProgressBar, Form, Alert } from "react-bootstrap";
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
import { API_BASE } from "../utils/api";

function StudentOnboardingPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: Replace with actual student ID from authentication
  const TEMP_STUDENT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

  useEffect(() => {
    loadStudentWorkflows();
  }, []);

  /**
   * Load all workflows for the current student
   * Now just a simple API call - all logic is on backend
   */
  const loadStudentWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/workflows/student/${TEMP_STUDENT_ID}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load workflows`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load workflows');
      }

      setWorkflows(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading workflows:", error);
      setError(error.message || "Failed to load your onboarding checklists");
      setLoading(false);
    }
  };

  /**
   * Toggle action completion status
   * Now just updates backend and reloads
   */
  const handleActionToggle = async (actionStateId, currentState) => {
    try {
      const newState = currentState === "completed" ? "notStarted" : "completed";

      const response = await fetch(
        `${API_BASE}/workflows/action-state/${actionStateId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stateType: newState }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update action`);
      }

      // Reload workflows to show updated state
      await loadStudentWorkflows();
    } catch (error) {
      console.error("Error updating action:", error);
      setError("Failed to update checklist item");
    }
  };

  /**
   * Handle clicking on action link
   * Marks action as complete and opens link in new tab
   */
  const handleActionLinkClick = async (actionState, linkUrl, linkType) => {
    console.log('handleActionLinkClick called:', {
      actionStateId: actionState.id,
      linkUrl,
      linkType,
      currentState: actionState.stateType
    });

    try {
      // Mark as completed if not already
      if (actionState.stateType !== "completed") {
        console.log('Marking action as completed...');
        const response = await fetch(
          `${API_BASE}/workflows/action-state/${actionState.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stateType: "completed" }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to update action:', response.status, errorText);
          throw new Error(`Failed to update action: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Action marked as completed successfully:', result);
      } else {
        console.log('Action already completed, skipping update');
      }

      // Wait a moment for database to fully update
      console.log('⏳ Waiting 500ms for database to update...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload workflows FIRST to update UI
      console.log('🔄 Reloading workflows to show completion...');
      await loadStudentWorkflows();
      console.log('✅ Workflows reloaded - UI should be updated now');

      // THEN open link
      console.log('=== ABOUT TO OPEN LINK ===');
      console.log('linkType:', linkType);
      console.log('linkUrl:', linkUrl);
      
      let finalUrl = linkUrl;
      
      // Ensure internal links have /cmt prefix
      if (linkType === 'internal') {
        if (!linkUrl.startsWith('/cmt/')) {
          console.log('Adding /cmt prefix to internal link');
          finalUrl = `/cmt${linkUrl}`;
        }
        console.log('✅ OPENING INTERNAL LINK IN NEW TAB:', finalUrl);
      } else {
        console.log('✅ OPENING EXTERNAL LINK IN NEW TAB:', finalUrl);
      }
      
      // Open ALL links in new tab
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      
      console.log('✅ Link opened in new tab. Original tab should show completion.');
      // Note: Workflows already reloaded above, so UI should be updated
    } catch (error) {
      console.error("Error handling action link:", error);
      setError("Failed to complete action");
    }
  };

  /**
   * Get appropriate icon for action based on name
   */
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

  /**
   * Calculate overall progress across all workflows
   */
  const getOverallProgress = () => {
    if (workflows.length === 0) return 0;
    const totalCompleted = workflows.reduce(
      (sum, w) => sum + w.progress.completed,
      0
    );
    const totalActions = workflows.reduce(
      (sum, w) => sum + w.progress.total,
      0
    );
    return totalActions > 0
      ? Math.round((totalCompleted / totalActions) * 100)
      : 0;
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="student-onboarding-page">
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
        <button className="btn btn-primary" onClick={loadStudentWorkflows}>
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (workflows.length === 0) {
    return (
      <div className="student-onboarding-page">
        <div className="empty-state">
          <Award size={64} />
          <h2>All Caught Up!</h2>
          <p>You do&apos;t have any onboarding tasks right now.</p>
          <p className="text-muted">
            New checklists will appear here when you enroll in courses.
          </p>
        </div>
      </div>
    );
  }

  // Main content
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
        {workflows.map((workflow) => (
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
                  {workflow.progress.completed} / {workflow.progress.total} completed
                </span>
                <ProgressBar
                  now={workflow.progress.percentage}
                  variant={
                    workflow.progress.percentage === 100 ? "success" : "info"
                  }
                  className="workflow-progress-bar"
                />
              </div>
            </Card.Header>

            <Card.Body>
              <div className="actions-checklist">
                {workflow.state.actionStates.map((actionState, actionIndex) => {
                  const action = actionState.action;
                  const isCompleted = actionState.stateType === "completed";
                  
                  // Sequential logic: Check if previous action is completed
                  const isPreviousCompleted = actionIndex === 0 || 
                    workflow.state.actionStates[actionIndex - 1].stateType === "completed";
                  const isLocked = !isPreviousCompleted && !isCompleted;

                  // Get link data from action metadata
                  const linkType = action.metadata?.linkType || 'none';
                  const linkUrl = action.metadata?.linkUrl || '';
                  const hasLink = linkType !== 'none' && linkUrl;

                  // Debug logging
                  console.log('Action:', action.name, {
                    linkType,
                    linkUrl,
                    hasLink,
                    metadata: action.metadata
                  });

                  return (
                    <div
                      key={actionState.id}
                      className={`checklist-item ${
                        isCompleted ? "completed" : ""
                      } ${isLocked ? "locked" : ""}`}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`action-${actionState.id}`}
                        checked={isCompleted}
                        onChange={() =>
                          handleActionToggle(
                            actionState.id,
                            actionState.stateType
                          )
                        }
                        disabled={isLocked || hasLink}
                        className="action-checkbox"
                      />
                      <div 
                        className={`action-content ${hasLink && !isLocked ? 'clickable' : ''}`}
                        onClick={() => {
                          console.log('Action div clicked:', {
                            hasLink,
                            isLocked,
                            linkUrl,
                            linkType
                          });
                          if (hasLink && !isLocked) {
                            handleActionLinkClick(actionState, linkUrl, linkType);
                          }
                        }}
                        style={{ cursor: hasLink && !isLocked ? 'pointer' : 'default' }}
                      >
                        <div className="action-icon">
                          {isCompleted ? (
                            <CheckCircle size={20} className="completed-icon" />
                          ) : isLocked ? (
                            <Circle size={20} className="locked-icon" />
                          ) : (
                            getIconForAction(action.name)
                          )}
                        </div>
                        <div className="action-details">
                          <div className="action-title">
                            {action.name}
                            {hasLink && !isLocked && (
                              <span className="action-link-indicator"> 🔗</span>
                            )}
                            {isLocked && (
                              <span className="action-locked-indicator"> 🔒</span>
                            )}
                          </div>
                          {action.description && (
                            <div className="action-description">
                              {action.description}
                            </div>
                          )}
                          {isLocked && (
                            <div className="action-locked-message">
                              Complete previous step first
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="action-number">{actionIndex + 1}</div>
                    </div>
                  );
                })}
              </div>

              {workflow.progress.percentage === 100 && (
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