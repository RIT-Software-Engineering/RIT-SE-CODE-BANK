import React, { useEffect, useState } from "react";
import { Accordion } from "semantic-ui-react";
import { config } from "../../util/functions/constants";
import { SecureFetch } from "../../util/functions/secureFetch";
import ActionPanel from "./ActionPanel";
import ActionTable from "./ActionTable";

export default function ActionEditor(props) {
    const [actions, setActionsData] = useState([]);
    const [projects, setProjects] = useState({});

    const fetchActions = async () => {
        try {
            const response = await SecureFetch(config.url.API_GET_ACTIONS);
            const actionsData = await response.json();
            setActionsData(actionsData);
        } catch (error) {
            console.error("Failed to get actions data:", error);
            alert("Failed to get actions data" + error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await SecureFetch(config.url.API_GET_PROJECTS);
            const projectsData = await response.json();
            // Create a map of project_id to project data
            const projectMap = {};
            projectsData.forEach(project => {
                projectMap[project.project_id] = project;
            });
            setProjects(projectMap);
        } catch (error) {
            console.error("Failed to get projects:", error);
        }
    };

    useEffect(() => {
        fetchActions();
        fetchProjects();
    }, []);

    const handleActionsUpdated = async () => {
        await fetchActions();
    };

    // Create semester panels
    const semesterPanels = props.semesterData.map(semester => {
        // Get actions for this semester
        const semesterActions = actions.filter(action => action.semester === semester.semester_id);
        
        // Group actions by project
        const projectMap = {};
        semesterActions.forEach(action => {
            if (!projectMap[action.project]) {
                projectMap[action.project] = [];
            }
            projectMap[action.project].push(action);
        });

        // Create project panels for this semester
        const projectPanels = Object.entries(projectMap).map(([projectId, projectActions]) => {
            const project = projects[projectId];
            const projectName = project ? project.title : `Project ${projectId}`;

            return {
                key: `project-${projectId}`,
                title: projectName,
                content: {
                    content: (
                        <ActionTable 
                            actions={projectActions} 
                            semesterData={props.semesterData}
                            onActionsUpdated={handleActionsUpdated}
                        />
                    )
                }
            };
        });

        return {
            key: `semester-${semester.semester_id}`,
            title: semester.name,
            content: {
                content: projectPanels.length > 0 ? (
                    <Accordion
                        fluid
                        styled
                        panels={projectPanels}
                    />
                ) : (
                    <div>No actions for this semester</div>
                )
            }
        };
    });

    // Add "No Semester" section if there are actions without a semester
    const noSemesterActions = actions.filter(action => !action.semester);
    if (noSemesterActions.length > 0) {
        const projectMap = {};
        noSemesterActions.forEach(action => {
            if (!projectMap[action.project]) {
                projectMap[action.project] = [];
            }
            projectMap[action.project].push(action);
        });

        const projectPanels = Object.entries(projectMap).map(([projectId, projectActions]) => {
            const project = projects[projectId];
            const projectName = project ? project.title : `Project ${projectId}`;

            return {
                key: `project-${projectId}`,
                title: projectName,
                content: {
                    content: (
                        <ActionTable 
                            actions={projectActions} 
                            semesterData={props.semesterData}
                            onActionsUpdated={handleActionsUpdated}
                        />
                    )
                }
            };
        });

        semesterPanels.unshift({
            key: 'no-semester',
            title: 'No Semester',
            content: {
                content: (
                    <Accordion
                        fluid
                        styled
                        panels={projectPanels}
                    />
                )
            }
        });
    }

    return (
        <div className="accordion-button-group">
            <Accordion
                fluid
                styled
                panels={[
                    {
                        key: "actionEditor",
                        title: "Action and Announcement Editor",
                        content: {
                            content: (
                                <Accordion
                                    fluid
                                    styled
                                    panels={semesterPanels}
                                />
                            )
                        }
                    }
                ]}
            />
            <div className="accordion-buttons-container">
                <ActionPanel
                    semesterData={props.semesterData}
                    header={"Create Action/Announcement"}
                    create={true}
                    key={"createAction"}
                    onActionUpdated={handleActionsUpdated}
                />
            </div>
        </div>
    );
}
