import React, { useState, useEffect } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHeader, 
    TableHeaderCell, 
    TableRow, 
    Button,
    Checkbox,
    Icon,
    Modal,
    Dropdown
} from "semantic-ui-react";
import _ from "lodash";
import ActionPanel from "./ActionPanel";
import {formatDateNoOffset, createSemesterDropdownOptions} from "../../util/functions/utils";
import PreviewHtml from "../../util/components/PreviewHtml";
import { config } from "../../util/functions/constants";
import { SecureFetch } from "../../util/functions/secureFetch";

export default function ActionTable(props) {
    // TODO: This is pretty inefficient and will get slower as more semesters are added - find better way to handle this.
    const semester = props.semesterData.find(semester => props.actions[0].semester === semester.semester_id)
    const semesterName = semester?.name
    const semesterStart = semester?.start_date
    const semesterEnd = semester?.end_date
    const [deleteModal, setdeleteModal] = React.useState(false);
    const [open, setOpen] = React.useState('false');
    const [closeOnDocClick, setCloseOnDocClick] = useState(true);
    const [selectedActions, setSelectedActions] = useState([]);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [targetSemester, setTargetSemester] = useState(null);
    const [targetProject, setTargetProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!targetSemester) return;
            
            try {
                setLoading(true);
                console.log('Fetching projects for semester:', targetSemester);
                const response = await SecureFetch(`${config.url.API_GET_PROJECTS_BY_SEMESTER}?semester=${targetSemester}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Received projects:', data);
                    const projectOptions = data.map(project => ({
                        key: project.project_id,
                        text: project.title || project.project_id,
                        value: project.project_id
                    }));
                    setProjects(projectOptions);
                } else {
                    console.error('Failed to fetch projects:', response.status);
                    setProjects([]);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [targetSemester]);

    const handleActionSelect = (action) => {
        setSelectedActions(prev => {
            const isSelected = prev.some(a => a.action_id === action.action_id);
            if (isSelected) {
                return prev.filter(a => a.action_id !== action.action_id);
            } else {
                return [...prev, action];
            }
        });
    };

    const handleCopySet = () => {
        if (selectedActions.length === 0) {
            alert("Please select at least one action to copy");
            return;
        }
        setShowCopyModal(true);
    };

    const handleConfirmCopy = async () => {
        if (!targetSemester) {
            alert("Please select a target semester");
            return;
        }

        if (!targetProject) {
            alert("Please select a project");
            return;
        }

        try {
            console.log('Copying actions:', {
                selectedActions,
                targetSemester,
                targetProject
            });

            const response = await SecureFetch(config.url.API_POST_COPY_ACTION_SET, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    actions: selectedActions,
                    targetSemester: targetSemester,
                    targetProject: targetProject
                })
            });

            console.log('Copy response status:', response.status);
            const responseData = await response.text();
            console.log('Copy response data:', responseData);

            if (response.status === 200) {
                setShowCopyModal(false);
                setSelectedActions([]);
                setTargetSemester(null);
                setTargetProject(null);
                alert('Actions copied successfully!');
                if (props.onActionsUpdated) {
                    props.onActionsUpdated();
                }
            } else {
                throw new Error('Failed to copy actions');
            }
        } catch (error) {
            console.error('Error copying actions:', error);
            alert('Failed to copy actions. Please try again.');
        }
    };

    const handleActionUpdated = async () => {
        if (props.onActionsUpdated) {
            await props.onActionsUpdated();
        }
    };

    const renderActions = () => {
        let actions = _.sortBy(props.actions, ["due_date", "start_date"])

        return actions.map((action, i) => {
            const isSelected = selectedActions.some(a => a.action_id === action.action_id);
            return (
                <TableRow key={i}>
                    <TableCell>
                        <Checkbox
                            checked={isSelected}
                            onChange={() => handleActionSelect(action)}
                        />
                    </TableCell>
                    <TableCell>{action.action_title}</TableCell>
                    <TableCell>{action.action_target}</TableCell>
                    <TableCell>{formatDateNoOffset(action.start_date)}</TableCell>
                    <TableCell>{formatDateNoOffset(action.due_date)}</TableCell>
                    <TableCell>
                        <div className="accordion-buttons-container" style={{ position: 'initial' }}>
                            <ActionPanel
                                actionData={action}
                                semesterData={props.semesterData}
                                header={`Currently Editing "${action.action_title}"`}
                                key={"editAction-" + i}
                                onActionUpdated={handleActionUpdated}
                            />
                            <ActionPanel
                                actionData={action}
                                semesterData={props.semesterData}
                                header={`Currently Copying "${action.action_title}"`}
                                create={true}
                                buttonIcon={"clone outline"}
                                key={"copyAction-" + i}
                                onActionUpdated={handleActionUpdated}
                            />
                            <PreviewHtml
                                action={action}
                                header={`Currently Viewing "${action.action_title}"`}
                                key={"viewHtml-" + i}
                            /> 
                            <PreviewHtml
                                action={action}
                                semesterName={semesterName}
                                trigger={ (<Button icon={<Icon name="trash" />} />)}
                                header={`Delete "${action.action_title}"`}
                                delete = {true}
                                key={"delete-" + i}
                            />
                        </div>
                    </TableCell>
                </TableRow>
            );
        });
    };

    return (
        <>
            <div>
                <div style={{ marginBottom: '1rem' }}>
                    <Button
                        primary
                        disabled={selectedActions.length === 0}
                        onClick={handleCopySet}
                        style={{ marginRight: '1rem' }}
                    >
                        Copy Selected Actions
                    </Button>
                    <Button
                        primary
                        onClick={() => {
                            setSelectedActions(props.actions);
                            setShowCopyModal(true);
                        }}
                    >
                        Copy All Actions
                    </Button>
                </div>
                <Table sortable>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>Select</TableHeaderCell>
                            <TableHeaderCell>Action Title</TableHeaderCell>
                            <TableHeaderCell>Action Target</TableHeaderCell>
                            <TableHeaderCell>Start Date</TableHeaderCell>
                            <TableHeaderCell>Due Date</TableHeaderCell>
                            <TableHeaderCell>Edit</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderActions()}
                    </TableBody>
                </Table>
            </div>

            <Modal 
                open={showCopyModal} 
                onClose={() => {
                    setShowCopyModal(false);
                    setTargetSemester(null);
                    setTargetProject(null);
                }}
                size="small"
                className="centered-modal"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxHeight: '80vh',
                    overflow: 'auto'
                }}
            >
                <Modal.Header>Copy Actions</Modal.Header>
                <Modal.Content>
                    <div>
                        <h3>Selected Actions ({selectedActions.length}):</h3>
                        <ul>
                            {selectedActions.map(action => (
                                <li key={action.action_id}>{action.action_title}</li>
                            ))}
                        </ul>
                        
                        <h3>Select Target Semester:</h3>
                        <Dropdown
                            fluid
                            placeholder="Select Semester"
                            options={createSemesterDropdownOptions(props.semesterData)}
                            onChange={(e, data) => setTargetSemester(data.value)}
                            value={targetSemester}
                            selection
                            style={{ marginBottom: '1rem' }}
                        />

                        <h3>Select Project:</h3>
                        <Dropdown
                            fluid
                            placeholder="Select Project"
                            options={projects}
                            onChange={(e, data) => setTargetProject(data.value)}
                            value={targetProject}
                            selection
                            loading={loading}
                        />
                    </div>
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={() => {
                        setShowCopyModal(false);
                        setTargetSemester(null);
                        setTargetProject(null);
                    }}>Cancel</Button>
                    <Button positive onClick={handleConfirmCopy}>Copy Actions</Button>
                </Modal.Actions>
            </Modal>
        </>
    );
}
