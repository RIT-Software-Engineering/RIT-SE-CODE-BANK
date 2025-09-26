import React, { useState, useEffect } from "react";
import { config } from "../../../util/functions/constants";
import DatabaseTableEditor from "../../../shared/editors/DatabaseTableEditor";
import { SecureFetch } from "../../../util/functions/secureFetch";

export default function ProjectPanel(props) {
    const [projects, setProjects] = useState([]);
    const [templateProject, setTemplateProject] = useState(null);
    const [formState, setFormState] = useState({
        project_id: "",
        title: "",
        description: "",
        semester: "",
        status: "in progress",
        template_project: null
    });

    useEffect(() => {
        // Fetch all projects for template selection
        SecureFetch(config.url.API_GET_PROJECTS)
            .then(response => response.json())
            .then(data => {
                const projectOptions = data.map(project => ({
                    key: project.project_id,
                    text: project.title,
                    value: project.project_id
                }));
                setProjects(projectOptions);
            })
            .catch(error => {
                console.error("Failed to fetch projects:", error);
            });
    }, []);

    let initialState = {
        project_id: props.project?.project_id || "",
        title: props.project?.title || "",
        description: props.project?.description || "",
        semester: props.project?.semester || "",
        status: props.project?.status || "in progress",
        template_project: null
    };

    let submissionModalMessages = {
        SUCCESS: initialState.project_id === "" ? "The project has been created." : "The project has been updated.",
        FAIL: initialState.project_id === "" ? "We were unable to create the project." : "We were unable to update the project.",
    };

    let submitRoute = initialState.project_id === "" ? config.url.API_POST_CREATE_PROJECT : config.url.API_POST_EDIT_PROJECT;

    const handleFormChange = (name, value) => {
        console.log('Form field changed:', { name, value });
        setFormState(prev => {
            const newState = {
                ...prev,
                [name]: value
            };
            console.log('New form state:', newState);
            return newState;
        });
    };

    let formFieldArray = [
        {
            type: "input",
            label: "Project Title",
            placeHolder: "Project Title",
            name: "title",
            required: true,
            maxLength: 50,
            onChange: (e, { value }) => handleFormChange("title", value)
        },
        {
            type: "dropdown",
            label: "Semester",
            placeHolder: "Select Semester",
            name: "semester",
            required: true,
            options: props.semesterData.map(semester => ({
                key: semester.semester_id,
                text: semester.name,
                value: semester.semester_id
            })),
            onChange: (e, { value }) => handleFormChange("semester", value)
        },
        {
            type: "textArea",
            label: "Description",
            placeHolder: "Project Description",
            name: "description",
            required: true,
            onChange: (e, { value }) => handleFormChange("description", value)
        },
        {
            type: "dropdown",
            label: "Template Project (Optional)",
            placeHolder: "Select a project to copy actions from",
            name: "template_project",
            options: projects,
            onChange: (e, { value }) => {
                console.log('Template project selected:', value);
                setTemplateProject(value);
                handleFormChange("template_project", value);
            }
        }
    ];

    const onSubmit = async (submittedData) => {
        console.log('onSubmit called with:', submittedData);
        console.log('Current form state:', formState);

        const dataToValidate = {
            ...formState,
            ...submittedData
        };

        console.log('Data to validate:', dataToValidate);

        if (!dataToValidate.title || !dataToValidate.description || !dataToValidate.semester) {
            console.error('Validation failed:', dataToValidate);
            throw new Error("Please fill in all required fields");
        }

        const projectData = {
            title: dataToValidate.title,
            description: dataToValidate.description,
            semester: dataToValidate.semester,
            status: "in progress",
            template_project: dataToValidate.template_project
        };

        console.log('Sending project data:', projectData);
        return projectData;
    };

    const onSuccess = async (response) => {
        if (initialState.project_id === "" && formState.template_project) {
            try {
                const createResult = await response.json();
                console.log('Project creation response:', createResult);

                // Ensure we have a valid project_id
                const newProjectId = createResult.project_id;
                if (!newProjectId) {
                    throw new Error('No project ID returned from creation');
                }

                // Fetch actions from template project
                console.log('Fetching actions from template project:', formState.template_project);
                const templateActionsResponse = await SecureFetch(`${config.url.API_GET_ACTIONS_BY_PROJECT}?project=${formState.template_project}`);
                if (!templateActionsResponse.ok) {
                    throw new Error('Failed to fetch template actions');
                }
                const templateActions = await templateActionsResponse.json();
                console.log('Template actions:', templateActions);

                if (!Array.isArray(templateActions) || templateActions.length === 0) {
                    console.log('No actions found in template project');
                    return;
                }

                // Copy all actions from template project to new project
                console.log('Copying actions to new project:', {
                    actions: templateActions,
                    targetSemester: formState.semester,
                    targetProject: newProjectId
                });

                const copyResponse = await SecureFetch(config.url.API_POST_COPY_ACTION_SET, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        actions: templateActions,
                        targetSemester: formState.semester,
                        targetProject: newProjectId
                    })
                });

                if (!copyResponse.ok) {
                    const errorText = await copyResponse.text();
                    console.error('Action copying failed:', errorText);
                    throw new Error('Failed to copy actions: ' + errorText);
                }

                console.log('Actions copied successfully');
            } catch (error) {
                console.error('Error copying actions:', error);
            }
        }
    };

    return (
        <DatabaseTableEditor
            initialState={formState}
            submissionModalMessages={submissionModalMessages}
            header={props.header}
            submitRoute={submitRoute}
            formFieldArray={formFieldArray}
            create={initialState.project_id === ""}
            button={props.button || (initialState.project_id === "" ? "plus" : "edit")}
            preSubmit={onSubmit}
            onSuccess={onSuccess}
            preChange={(formData, name, value) => {
                handleFormChange(name, value);
                return {
                    ...formData,
                    [name]: value
                };
            }}
        />
    );
} 