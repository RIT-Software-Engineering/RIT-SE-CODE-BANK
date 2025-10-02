import { placeholder } from "@uiw/react-codemirror";
import DatabaseTableEditor from "../../shared/editors/DatabaseTableEditor";
import {
  ACTION_TARGETS,
  config,
  DROPDOWN_ITEMS,
} from "../../util/functions/constants";
import { UserContext } from "../../util/functions/UserContext";
import {
  createSemesterDropdownOptions,
  humanFileSize,
  SEMESTER_DROPDOWN_NULL_VALUE,
} from "../../util/functions/utils";
import { useState, useEffect, useContext } from "react";
import { create, initial } from "lodash";
import { SecureFetch } from "../../util/functions/secureFetch";

const short_desc = "short_desc";
const file_types = "file_types";
const action_target = "action_target";
const file_size = "file_size";
const start_date = "start_date";
const due_date = "due_date";

export default function ActionPanel(props) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const userContext = useContext(UserContext);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionDetailsById, setActionDetailsById] = useState({});

  const [initialState, setInitialState] = useState({
    
    action_id: props.actionData?.action_id || "",
    action_title: props.actionData?.action_title || "",
    semester: props.actionData?.semester || "",
    project: props.actionData?.project || "",
    action_target: props.actionData?.action_target || "",
    date_deleted: props.actionData?.date_deleted || "",
    activation_date: props.actionData?.activation_date || "",
    short_desc: props.actionData?.short_desc || "",
    start_date: props.actionData?.start_date || "",
    due_date: props.actionData?.due_date || "",
    page_html: props.actionData?.page_html || "",
    file_types: props.actionData?.file_types || "",
    file_size: props.actionData?.file_size
      ? humanFileSize(props.actionData?.file_size, false, 0)
      : "",
    parent_id: props.actionData?.parent_id || 0,
    created_by_id: userContext.user.user,
  });

  const fetchProjects = async (semester) => {
    if (!semester) return;

    try {
      setLoading(true);
      const response = await SecureFetch(`${config.url.API_GET_PROJECTS_BY_SEMESTER}?semester=${semester}`);
      if (response.ok) {
        const data = await response.json();
        const projectOptions = data.map(project => ({
          key: project.project_id,
          text: project.title || project.project_id,
          value: project.project_id
        }));
        setProjects(projectOptions);
      } else {
        console.error('Failed to fetch projects:', response.status);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(initialState.semester);
  }, [initialState.semester]);

  const createParentDropdownOptions = async (project) => {
    if (!project) return;
    try {
      setLoading(true);
      const response = await SecureFetch(`${config.url.API_GET_ACTIONS_BY_PROJECT}?project=${project}`);
      if (response.ok) {
        const data = await response.json();
        const actionOptions = data.map(action => ({
          key: action.action_id,
          text: action.action_title,
          value: action.action_id
        }));
  
        const actionMap = {};
        data.forEach(action => {
          actionMap[action.action_id] = action;
        });
  
        setActions(actionOptions);
        setActionDetailsById(actionMap);  // Save full action data here
      } else {
        console.error('Failed to fetch actions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    createParentDropdownOptions(initialState.project);
  }, [initialState.project]);


  let submissionModalMessages = props.create
    ? {
      SUCCESS: "The action has been created.",
      FAIL: "We were unable to create your action.",
    }
    : {
      SUCCESS: "The action has been Edited.",
      FAIL: "We were unable to receive your edits.",
    };
  let semesterMap = {};

  for (let i = 0; i < props.semesterData.length; i++) {
    const semester = props.semesterData[i];
    semesterMap[semester.semester_id] = semester.name;
  }

  let submitRoute = props.create
    ? config.url.API_POST_CREATE_ACTION
    : config.url.API_POST_EDIT_ACTION;

  
  let formFieldArray = [
    {
      type: "input",
      label: "Action Title",
      placeHolder: "Action Title",
      name: "action_title",
    },
    {
      type: "dropdown",
      label: "Semester",
      placeHolder: "Semester",
      name: "semester",
      options: createSemesterDropdownOptions(props.semesterData),
      nullValue: SEMESTER_DROPDOWN_NULL_VALUE,
      loading: props.semesterData.loading,
    },
    {
      type: "dropdown",
      label: "Project",
      placeHolder: "Project",
      name: "project",
      options: projects,
      loading: loading,
    },
    {
      type: "dropdown",
      label: "Parent Action",
      placeHolder: "No Parent",
      name: "parent_id",
      options: actions,
      loading: loading,
    },
    {
      type: "dropdown",
      label: "Action Target",
      placeHolder: "Action Target",
      name: action_target,
      options: (props.create ? DROPDOWN_ITEMS.actionTarget : DROPDOWN_ITEMS.actionTargetEdit) ,
    },
    {
      type: "input",
      label: "Short Desc (Not used for announcements)",
      placeHolder: "Short Desc",
      name: short_desc,
    },
    {
      type: "date",
      label: "Start Date",
      placeHolder: "Start Date",
      name: "start_date",
    },
    {
      type: "date",
      label: "Due Date / Announcement End Date",
      placeHolder: "Due Date / Announcement End Date",
      name: "due_date",
    },
    // PLANNING: When the action is a peer-eval, we would replace textArea with our fourm buider
    // Or add a taggle to switch bettwen the html and the form builder
    {
      type: "textArea",
      label: "Page Html",
      placeHolder: "Page Html",
      name: "page_html",
    },
    {
      type: "input",
      label:
        "Upload Files (No spaces and ensure . prefix is added - Example: .png,.pdf,.txt) (Not used for announcements)",
      placeHolder: "CSV format please - No filetypes = no files uploaded",
      name: file_types,
    },
    {
      type: "input",
      label:
        "File Upload Limit (Default 15 MB) (Number and then either KB, MB, or GB after - Example: 500 KB, 10 MB, 1 GB) (Server limit currently 1GB) (Not used for announcements)",
      placeHolder: "File Upload Limit",
      name: file_size,
    },
    {
      type: "activeCheckbox",
      label: "Active",
      placeHolder: "Active",
      name: "date_deleted",
    },{
      type: "date",
      label: "Activation Date",
      placeHolder: "Activation Date",
      name: "activation_date",
    },
  ];

  //Processing to be done before data is sent to the backend.
  const preChange = (formData, name, value) => {
    let updatedFormData = { ...formData }; // Always clone first
  
    if (name === 'semester') {
      fetchProjects(value);
    }
  
    if (name === 'project') {
      createParentDropdownOptions(value);
    }
  
    if (name === 'parent_id' && value && actionDetailsById[value]) {
      const parentAction = actionDetailsById[value];
      
      // Here we set the start_date, due_date, and action_target based on the parent action
      updatedFormData = {
        ...updatedFormData,
        start_date: parentAction.start_date || "", // Fill the start_date from the parent action
        due_date: parentAction.due_date || "", // Fill the due_date from the parent action
        [action_target]: parentAction.action_target || "", // Fill the action_target from the parent action
        parent_id: value, // Also update the selected parent
      };
    } else {
      updatedFormData[name] = value;
    }
  
    if (
      name === action_target &&
      [
        ACTION_TARGETS.coach_announcement,
        ACTION_TARGETS.student_announcement,
      ].includes(value)
    ) {
      updatedFormData = {
        ...updatedFormData,
        [short_desc]: "",
        [file_types]: "",
        [action_target]: value,
      };
    }
  
    return updatedFormData;
  };
  

  const handleSubmitSuccess = async () => {
    if (props.onActionUpdated) {
      await props.onActionUpdated();
    }
  };

  if (props.isOpenCallback) {
    return (
      <DatabaseTableEditor
        initialState={initialState}
        submissionModalMessages={submissionModalMessages}
        submitRoute={submitRoute}
        formFieldArray={formFieldArray}
        semesterData={props.semesterData}
        header={props.header}
        create={!!props.create}
        button={props.buttonIcon || (!!props.create ? "plus" : "edit")}
        trigger={props.trigger}
        isOpenCallback={props.isOpenCallback}
        onClose={() => {
          setOpen(false);
          props.isOpenCallback(false);
        }}
        onOpen={() => {
          setOpen(true);
          props.isOpenCallback(true);
        }}
        open={open}
        preChange={preChange}
        preSubmit={(data) => {
          if (data.semester === SEMESTER_DROPDOWN_NULL_VALUE) {
            data.semester = "";
          }
          return data;
        }}
        onSubmitSuccess={handleSubmitSuccess}
      />
    );
  } else {
    return (
      <DatabaseTableEditor
        initialState={initialState}
        submissionModalMessages={submissionModalMessages}
        submitRoute={submitRoute}
        formFieldArray={formFieldArray}
        semesterData={props.semesterData}
        header={props.header}
        create={!!props.create}
        button={props.buttonIcon || (!!props.create ? "plus" : "edit")}
        trigger={props.trigger}
        preChange={preChange}
        preSubmit={(data) => {
          if (data.semester === SEMESTER_DROPDOWN_NULL_VALUE) {
            data.semester = "";
          }
          return data;
        }}
        onSubmitSuccess={handleSubmitSuccess}
      />
    );
  }
}


