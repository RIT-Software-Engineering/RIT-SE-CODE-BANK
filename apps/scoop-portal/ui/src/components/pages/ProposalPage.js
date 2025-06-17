import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Modal, Form, Radio, Divider, Button } from "semantic-ui-react";
import { config } from "../util/functions/constants";
import "../../css/proposal.css";
import { SecureFetch } from "../util/functions/secureFetch";

const MODAL_STATUS = { SUCCESS: "success", FAIL: "fail", CLOSED: false };

const PROJECT_STATUSES = {
    SUBMITTED: "submitted",
    NEEDS_REVISION: "needs revision",
    FUTURE_PROJECT: "future project",
    CANDIDATE: "candidate",
    IN_PROGRESS: "in progress",
    COMPLETE: "completed",
    ARCHIVED: "archive",
};

function ProposalPage() {
    const history = useHistory();
    const [formData, setActualFormData] = useState({ assignment_of_rights: "full_rights" });
    const [formFiles, setFormFiles] = useState(null);
    const [modalOpen, setModalOpen] = useState(MODAL_STATUS.CLOSED);
    const [errors, setErrors] = useState({});
    const [semesterData, setSemesterData] = useState([]);

    useEffect(() => {
        SecureFetch(config.url.API_GET_SEMESTERS)
            .then(response => response.json())
            .then(data => {
                setSemesterData(data);
            })
            .catch(error => {
                console.error("Failed to fetch semesters:", error);
            });
    }, []);

    const setFormData = (event) => {
        // Handle Semantic UI dropdown events
        if (event && event.target && event.target.type === undefined) {
            const { name, value } = event.target;
            setActualFormData({
                ...formData,
                [name]: value,
            });
            return;
        }

        // Handle regular form input events
        const target = event.target;
        let value;
        switch (target.type) {
            case "textarea":
            case "text":
            case "radio":
                value = target.value;
                break;
            case "checkbox":
                value = target.checked;
                break;
            case "file":
                setFormFiles(target.files);
                return;
            default:
                console.error("Input type not handled...not setting data");
                return;
        }
        const name = target.name;

        setActualFormData({
            ...formData,
            [name]: value,
        });
    };

    const submitProposal = async (event) => {
        event.preventDefault();

        if (modalOpen) {
            console.warn("Trying to submit proposal form while modal is open.");
            return;
        }

        const body = new FormData();
        Object.keys(formData).forEach((key) => {
            body.append(key, formData[key]);
        });

        for (let i = 0; i < formFiles?.length || 0; i++) {
            body.append("attachments", formFiles[i]);
        }

        SecureFetch(config.url.API_POST_SUBMIT_PROJECT, {
            method: "post",
            body: body,
        })
            .then((response) => {
                if (response.status === 200) {
                    setModalOpen(MODAL_STATUS.SUCCESS);
                } else {
                    setModalOpen(MODAL_STATUS.FAIL);
                    return response.json();
                }
            })
            .then((error) => {
                if (error?.errors) {
                    let receivedErrors = {}
                    error.errors?.forEach(error => {
                        receivedErrors[error.param] = error.msg;
                    });
                    setErrors(receivedErrors);
                }
            })
            .catch((error) => {
                // TODO: Redirect to failed page or handle errors
                console.error(error);
            });
    };

    const generateModalFields = () => {
        switch (modalOpen) {
            case MODAL_STATUS.SUCCESS:
                return {
                    header: "Success",
                    content:
                        "Your proposal has been received. We will review it and get back to you if our students decide to move forward with it",
                    actions: [{ header: "Success!", content: "Close", positive: true, key: 0 }],
                };
            case MODAL_STATUS.FAIL:
                return {
                    header: "There was an issue...",
                    content:
                        "We were unable to submit your proposal.",
                    actions: [{ header: "There was an issue", content: "Cancel", positive: true, key: 0 }],
                };
            default:
                return;
        }
    };

    const closeModal = () => {
        switch (modalOpen) {
            case MODAL_STATUS.SUCCESS:
                setActualFormData({});
                setFormFiles(null);
                setModalOpen(MODAL_STATUS.CLOSED);
                setErrors({});
                break;
            case MODAL_STATUS.FAIL:
                setModalOpen(MODAL_STATUS.CLOSED);
                break;
            default:
                console.error(`MODAL_STATUS of '${modalOpen}' not handled`);
        }
    };

    return (
        <>
            <Modal open={!!modalOpen} {...generateModalFields()} onClose={() => closeModal()} dimmer="blurring"
                   className={"sticky"} />
            <div className="row">
                <h2>Submit A Project Proposal</h2>
            </div>
            <Form
                id="proposalForm"
                className="ui form"
                onSubmit={(e) => {
                    submitProposal(e);
                }}
            >
                <Form.Input
                    required
                    label="Project Title"
                    name="title"
                    value={formData.title || ""}
                    onChange={(e) => {
                        setFormData(e);
                    }}
                    error={errors.title && { content: errors.title, pointing: "below" }}
                />
                <Form.TextArea
                    required
                    label="Project Description"
                    name="description"
                    value={formData.description || ""}
                    onChange={(e) => {
                        setFormData(e);
                    }}
                    error={errors.description && { content: errors.description, pointing: "below" }}
                />
                <Form.Dropdown
                    required
                    label="Semester"
                    name="semester"
                    options={semesterData.map(semester => ({
                        key: semester.semester_id,
                        text: semester.name,
                        value: semester.semester_id
                    }))}
                    value={formData.semester || ""}
                    onChange={(e, { value }) => {
                        setFormData({ ...formData, semester: value });
                    }}
                    error={errors.semester && { content: errors.semester, pointing: "below" }}
                />
                <Form.Dropdown
                    required
                    label="Status"
                    name="status"
                    options={Object.values(PROJECT_STATUSES).map((status, idx) => ({
                        key: idx,
                        text: status,
                        value: status
                    }))}
                    value={formData.status || ""}
                    onChange={(e, { value }) => {
                        setFormData({ ...formData, status: value });
                    }}
                    error={errors.status && { content: errors.status, pointing: "below" }}
                />
                <Button type="submit">Submit Proposal</Button>
            </Form>
        </>
    );
}

export default ProposalPage;
