import React, { useEffect, useState } from "react";
import { config, USERTYPES } from "../../util/functions/constants";
import { SecureFetch } from "../../util/functions/secureFetch";
import { createSemesterDropdownOptions, SEMESTER_DROPDOWN_NULL_VALUE } from "../../util/functions/utils";
import DatabaseTableEditor from "../../shared/editors/DatabaseTableEditor";
import {decode} from "html-entities";

const PROJECT_STATUSES = {
    SUBMITTED: "submitted",
    NEEDS_REVISION: "needs revision",
    FUTURE_PROJECT: "future project",
    CANDIDATE: "candidate",
    IN_PROGRESS: "in progress",
    COMPLETE: "completed",
    ARCHIVED: "archive",
};

export const formattedAttachments = (project) => {
    return project?.attachments?.split(", ").map(attachment => {
        return {
            title: attachment,
            link: `${config.url.API_GET_PROPOSAL_ATTACHMENT}?project_id=${project.project_id}&name=${attachment}`,
        }
    })
}

/**
 * Note: Now that ProjectViewModal exists, there isn't much of a need for the viewOnly prop,
 * but I'll leave it in for now.
 * 
 * @param {*} props 
 * @returns 
 */
export default function ProjectEditorModal(props) {

    const [projectMembers, setProjectMembers] = useState({ students: [], coaches: [] })
    const [initialState, setInitialState] = useState({
        project_id: props.project.project_id || "",
        display_name: decode(props.project.display_name) || "",
        title: decode(props.project.title) || "",
        attachments: formattedAttachments(props.project) || [],
        background_info: decode(props.project.background_info).replace(/\r\n|\r/g, '\n') || "",
        project_description: decode(props.project.project_description).replace(/\r\n|\r/g, '\n') || "",
        project_scope: decode(props.project.project_scope).replace(/\r\n|\r/g, '\n') || "",
        project_challenges: decode(props.project.project_challenges).replace(/\r\n|\r/g, '\n') || "",
        constraints_assumptions: decode(props.project.constraints_assumptions).replace(/\r\n|\r/g, '\n') || "",
        project_search_keywords: decode(props.project.project_search_keywords) || "",
        sponsor_deliverables: decode(props.project.sponsor_deliverables).replace(/\r\n|\r/g, '\n') || "",
        proprietary_info: decode(props.project.proprietary_info).replace(/\r\n|\r/g, '\n') || "",
        project_agreements_checked: props.project.project_agreements_checked || "",
        assignment_of_rights: props.project.assignment_of_rights || "",
        team_name: decode(props.project.team_name) || "",
        poster: decode(props.project.poster) || "",
        video: decode(props.project.video) || "",
        website: props.project.website || "",
        synopsis: decode(props.project.synopsis).replace(/\r\n|\r/g, '\n') || "",
        semester: props.project.semester || "",
        date: props.project.date || "",
        status: props.project.status || "",
    })

    useEffect(() => {
        SecureFetch(`${config.url.API_GET_PROJECT_MEMBERS}?project_id=${props.project?.project_id}`)
            .then(response => response.json())
            .then(members => {
                let projectMemberOptions = { students: [], coaches: [] }
                let projectGroupedValues = { students: [], coaches: [] }
                members.forEach(member => {
                    switch (member.type) {
                        case USERTYPES.STUDENT:
                            projectMemberOptions.students.push({ key: member.system_id, text: `${member.lname}, ${member.fname} (${member.system_id})`, value: member.system_id });
                            projectGroupedValues.students.push(member.system_id);
                            break;
                        case USERTYPES.COACH:
                            if (props.viewOnly) {
                                projectMemberOptions.coaches.push({ key: member.system_id, text: `${member.lname}, ${member.fname} (${member.system_id})`, value: member.system_id });
                            }
                            projectGroupedValues.coaches.push(member.system_id);
                            break;
                        default:
                            console.error(`Project editor error - invalid project member type "${member.type}" for member: `, member);
                            break;
                    }
                });
                setInitialState((prevInitialState) => {
                    return {
                        ...prevInitialState,
                        projectStudents: projectGroupedValues.students,
                        projectCoaches: projectGroupedValues.coaches,
                    }
                });
                setProjectMembers(projectMemberOptions);
            })
    }, [props.project, props.viewOnly])

    let submissionModalMessages = {
        SUCCESS: "The project has been updated.",
        FAIL: "We were unable to receive your update to the project.",
    };

    const options = Object.keys(PROJECT_STATUSES).map((status, idx) => {
        return {
            key: idx,
            text: PROJECT_STATUSES[status],
            value: PROJECT_STATUSES[status],
        };
    });

    let formFieldArray = [
        {
            type: "input",
            label: "Project ID",
            placeHolder: "Project ID",
            name: "project_id",
            disabled: true,
            hidden: props.viewOnly,
        },
        {
            type: "input",
            label: "Title",
            placeHolder: "Title",
            name: "title",
        },
        {
            type: "textArea",
            label: "Description",
            placeHolder: "Description",
            name: "description",
        },
        {
            type: "dropdown",
            label: "Status",
            placeHolder: "Status",
            name: "status",
            options: options,
        },
        {
            type: "dropdown",
            label: "Semester",
            placeHolder: "Semester",
            name: "semester",
            options: props.semesterData.map(semester => ({
                key: semester.semester_id,
                text: semester.name,
                value: semester.semester_id
            })),
        }
    ];

    let fetchOptions = {
        headers: {
            "Content-Type": "application/json",
        },
    }

    return (
        <DatabaseTableEditor
            initialState={initialState}
            submissionModalMessages={submissionModalMessages}
            submitRoute={props.viewOnly ? "" : config.url.API_POST_EDIT_PROJECT}
            formFieldArray={formFieldArray}
            semesterData={props.semesterData}
            header={`${props.viewOnly ? "Viewing" : "Editing"} project: ${props.project.display_name || props.project.title}`}
            fetchOptions={fetchOptions}
            button={props.viewOnly ? "eye" : "edit"}
            viewOnly={props.viewOnly}
        />
    );
}
