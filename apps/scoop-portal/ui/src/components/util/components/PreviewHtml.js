import React, { useState, act } from 'react'
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import {Form, Icon, Input, Modal} from "semantic-ui-react";
import {formatDateNoOffset, humanFileSize} from "../functions/utils";
import {ACTION_TARGETS, DEFAULT_UPLOAD_LIMIT} from "../functions/constants";
import Announcements from "../../Tabs/DashboardTab/TimelinesView/Announcements";
import { config } from "../../util/functions/constants";
import { SecureFetch } from "../../util/functions/secureFetch";
import {
    QuestionComponentsMap,

} from "./PeerEvalComponents";
import ParsedInnerHTML from "./ParsedInnerHtml";
import { isBuffer } from 'lodash';

const MODAL_STATUS = { SUCCESS: "success", FAIL: "fail", SUBMITTED: "submitted", CLOSED: false };

export default function PreviewHtml(props){
    let submissionModalMessages = {
      SUCCESS: "The action has been deleted.",
      FAIL: "We were unable to delete your action.",
      SUBMITTED: "This action has already been submitted",
    }

    const [open, setOpen] = React.useState(false);
      const [submissionModalOpen, setSubmissionModalOpen] = useState(
        MODAL_STATUS.CLOSED
      );

    const submissionTypeMap = {
        [ACTION_TARGETS.individual]: "Individual",
        [ACTION_TARGETS.peer_evaluation]: "Individual",
        [ACTION_TARGETS.team]: "Team",
        [ACTION_TARGETS.coach]: "Coach",
        [ACTION_TARGETS.admin]: "Admin",
    }

    function modalContent(props) {
        const isStudentAnnouncement = props.action.action_target === ACTION_TARGETS.student_announcement;
        const isCoachAnnouncement = props.action.action_target === ACTION_TARGETS.coach_announcement;
        const isPeerEvaluation = props.action.action_target === ACTION_TARGETS.peer_evaluation;

        if(isStudentAnnouncement || isCoachAnnouncement){
            return (
                <Announcements announcements={[props.action]} semesterName={props.semesterName}/>
            )
        }

         return(
            <div>
                {preActionContent()}
                <br/>
                {
                    isPeerEvaluation ?
                        <ParsedInnerHTML html={props.action.page_html} components={QuestionComponentsMap} />:
                        <div className="content" dangerouslySetInnerHTML={{__html: props.action.page_html}}/>
                }
                <br/>
                {fileUpload(props.action.file_types, props.action.file_size)}
            </div>
         )
    }

    function preActionContent() {
        return <>
            <p>{props.action?.short_desc}</p>
            <p>Starts: {formatDateNoOffset(props.action?.start_date)}</p>
            <p>Due: {formatDateNoOffset(props.action?.due_date)}</p>
            <p>Project: <i>project name here</i></p>
            <p>Submission Type: {submissionTypeMap[props.action?.action_target]}</p>
            <p><b>Submission list here</b></p>
        </>
    }

    function fileUpload(fileTypes, fileSize) {
        return fileTypes && <Form>
            <Form.Field required>
                <label className="file-submission-required">File Submission (Accepted: {fileTypes.split(",").join(", ")})
                    (Max size of each file: {humanFileSize((fileSize || DEFAULT_UPLOAD_LIMIT), false, 0)})
                </label>
                <Input fluid required type="file" accept={fileTypes} multiple />
            </Form.Field>
        </Form>;
    }

    const handleDeleteAction = async (action) => {
        let body = new FormData();
        body.append("id", action["action_id"]);
        const response = await SecureFetch(config.url.API_DELETE_ACTION, {
            method: "POST",
            body: body,
        })
            .then((response) => {
                if (response.status === 200) {
                    setSubmissionModalOpen(MODAL_STATUS.SUCCESS);
                } 
                else if (response.status === 403){
                    console.log(response.text())
                    setSubmissionModalOpen(MODAL_STATUS.SUBMITTED);
                }
                else {
                    setSubmissionModalOpen(MODAL_STATUS.FAIL);
                }
                if (props.callback) {
                    props.callback();
                }
            })
            .catch((error) => {
                setSubmissionModalOpen(MODAL_STATUS.FAIL);
            });
    }

    const generateModalFields = () => {
        switch (submissionModalOpen) {
            case MODAL_STATUS.SUCCESS:
                return {
                    header: "Success",
                    content: submissionModalMessages["SUCCESS"],
                    actions: [
                        { header: "Success!", content: "Close", positive: true, key: 0 },
                    ],
                };
            case MODAL_STATUS.SUBMITTED:
                return {
                    header: "There was an issue...",
                    content: [<ul><li>{submissionModalMessages["SUBMITTED"]}</li><li>You are not allowed to delete this action</li></ul>],
                    actions: [
                        { header: "There was an issue", content: "Close", positive: true, key: 0 },
                    ],
                };
            case MODAL_STATUS.FAIL:
                return {
                    header: "There was an issue...",
                    content: submissionModalMessages["FAIL"],
                    actions: [
                        {
                            header: "There was an issue",
                            content: "Cancel",
                            positive: true,
                            key: 0,
                        },
                    ],
                };
            default:
                return;
        }
      };

      const closeSubmissionModal = () => {
        switch (submissionModalOpen) {
          case MODAL_STATUS.SUCCESS:
            setSubmissionModalOpen(MODAL_STATUS.CLOSED);
            if (props.reload) {
              props.reloadData();
            }
            break;
          case MODAL_STATUS.SUBMITTED:
            setSubmissionModalOpen(MODAL_STATUS.CLOSED);
            break;
          case MODAL_STATUS.FAIL:
            setSubmissionModalOpen(MODAL_STATUS.CLOSED);
            break;
          default:
            console.error(`MODAL_STATUS of '${submissionModalOpen}' not handled`);
        }
      };

    if (props.isOpenCallback) {
        return (
            <Modal
                className={"sticky"}
                trigger={
                    props.trigger || (<Button icon={<Icon name="eye" />}/>)}
                onClose={() => {
                    setOpen(false);
                    props.isOpenCallback(false);
                    }}
                onOpen={() => {
                    setOpen(true);
                    props.isOpenCallback(true);
                    }}
                open={open}
                header={props.header}
                content={{
                    content:
                        modalContent(props)
                }}
                actions={[
                    {
                        key: "Close",
                        content: "Close",
                    }
                ]}
            />
        )
    } 
    else if (props.delete == true){
        return(
            <><Modal
                className={"sticky"}
                trigger={props.trigger || (<Button icon={<Icon name="eye" />} />)}
                header={props.header}
                content={{
                    content: modalContent(props)
                }}
                actions={[
                    {
                        key: "Cancel",
                        content: "Cancel",
                    },
                    {
                        key: "Confirm",
                        content: "Confirm",
                        onClick: () => handleDeleteAction(props.action)
                    }
                ]} /><Modal
                    className={"sticky"}
                    size="tiny"
                    open={!!submissionModalOpen}
                    {...generateModalFields()}
                    onClose={() => closeSubmissionModal()} /></>
        )
    }
    else {
        return (
            <Modal
                className={"sticky"}
                trigger={
                    props.trigger || (<Button icon={<Icon name="eye" />}/>)}
                header={props.header}
                content={{
                    content:
                        modalContent(props)
                }}
                actions={[
                    {
                        key: "Close",
                        content: "Close",
                    }
                ]}
            />
        )
    }
}