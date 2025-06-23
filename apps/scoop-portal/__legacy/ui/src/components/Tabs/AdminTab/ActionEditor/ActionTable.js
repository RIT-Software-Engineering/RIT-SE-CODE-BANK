import React, { useState } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHeader, 
    TableHeaderCell, 
    TableRow, 
    Accordion,
    Button,
    Checkbox,
    Modal,
    Dropdown
} from "semantic-ui-react";
import _ from "lodash";
import ActionPanel from "./ActionPanel";
import {formatDateNoOffset, createSemesterDropdownOptions} from "../../../util/functions/utils";
import PreviewHtml from "../../../util/components/PreviewHtml";
import GanttChart from "../../DashboardTab/TimelinesView/Timeline/GanttChart";
import { config } from "../../../util/functions/constants";
import { SecureFetch } from "../../../util/functions/secureFetch";

export default function ActionTable(props) {
    // TODO: This is pretty inefficient and will get slower as more semesters are added - find better way to handle this.
    const semester = props.semesterData.find(semester => props.actions[0].semester === semester.semester_id)
    const semesterName = semester?.name
    const semesterStart = semester?.start_date
    const semesterEnd = semester?.end_date
    // const semesterName = props.semesterData.find(semester => props.actions[0].semester === semester.semester_id)?.name;
    const [open, setOpen] = React.useState('false');
    const [closeOnDocClick, setCloseOnDocClick] = useState(true);
    const [selectedActions, setSelectedActions] = useState([]);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [targetSemester, setTargetSemester] = useState(null);

    function isOpenCallback(isOpen) {
        setCloseOnDocClick(!isOpen);
    }

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

        try {
            const response = await SecureFetch(config.url.API_POST_COPY_ACTION_SET, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    actions: selectedActions,
                    targetSemester: targetSemester
                })
            });

            if (response.status === 200) {
                // Reset state and close modal
                setShowCopyModal(false);
                setSelectedActions([]);
                setTargetSemester(null);
                
                // Show success message
                alert('Actions copied successfully!');
                
                // Refresh the actions list
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
                            />
                            <ActionPanel
                                actionData={action}
                                semesterData={props.semesterData}
                                header={`Currently Copying "${action.action_title}"`}
                                create={true}
                                buttonIcon={"clone outline"}
                                key={"copyAction-" + i}
                            />
                            <PreviewHtml
                                action={action}
                                semesterName={semesterName}
                                header={`Currently Viewing "${action.action_title}"`}
                                key={"viewHtml-" + i}
                            />
                        </div>
                    </TableCell>
                </TableRow>
            );
        });
    };

    let title;
    if (props.actions[0].name === null){
        title = "No semester";
    } else {
        title = semesterName;
    }

    return (
        <>
            <Accordion
                fluid
                styled
                panels={[
                    {
                        key: "actionEditor",
                        title: title || "No Semester",
                        content: {
                            content: (
                                <div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <Button
                                            primary
                                            disabled={selectedActions.length === 0}
                                            onClick={handleCopySet}
                                        >
                                            Copy Selected Actions
                                        </Button>
                                    </div>
                                    <Table sortable>
                                        <TableHeader>
                                            <TableRow key={"actionEditorTableHeaders"}>
                                                <TableHeaderCell>Select</TableHeaderCell>
                                                <TableHeaderCell
                                                // sorted={proposalData.column === COLUMNS.DATE ? proposalData.direction : null}
                                                // onClick={() => changeSort(COLUMNS.DATE)}
                                                >
                                                    Action Title
                                                </TableHeaderCell>

                                                <TableHeaderCell
                                                // sorted={proposalData.column === COLUMNS.ACTION ? proposalData.direction : null}
                                                // onClick={() => changeSort(COLUMNS.ACTION)}
                                                >
                                                    Action Target
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                // sorted={proposalData.column === COLUMNS.TITLE ? proposalData.direction : null}
                                                // onClick={() => changeSort(COLUMNS.TITLE)}
                                                >
                                                    Start Date
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                // sorted={proposalData.column === COLUMNS.ATTACHMENTS ? proposalData.direction : null}
                                                // onClick={() => changeSort(COLUMNS.ATTACHMENTS)}
                                                >
                                                    Due Date
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                // sorted={proposalData.column === COLUMNS.EDIT ? proposalData.direction : null}
                                                // onClick={() => changeSort(COLUMNS.EDIT)}
                                                >
                                                    Edit
                                                </TableHeaderCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>{renderActions()}</TableBody>
                                    </Table>
                                    <GanttChart
                                        admin="true"
                                        semesterData={props.semesterData}
                                        semesterName={semesterName}
                                        projectStart={semesterStart} 
                                        projectEnd={semesterEnd} 
                                        actions={props.actions}
                                        isOpen={open}
                                    />
                                </div>
                            ),
                        },
                    },
                ]}
                onTitleClick={(e, data)=>setOpen(data.active)}
            />

            <Modal 
                open={showCopyModal} 
                onClose={() => setShowCopyModal(false)}
                centered
                dimmer="blurring"
            >
                <Modal.Header>Copy Action Set</Modal.Header>
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
                            placeholder="Select Semester"
                            options={createSemesterDropdownOptions(props.semesterData)}
                            onChange={(e, data) => setTargetSemester(data.value)}
                            value={targetSemester}
                        />
                    </div>
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={() => setShowCopyModal(false)}>Cancel</Button>
                    <Button positive onClick={handleConfirmCopy}>Copy Actions</Button>
                </Modal.Actions>
            </Modal>
        </>
    );
}
