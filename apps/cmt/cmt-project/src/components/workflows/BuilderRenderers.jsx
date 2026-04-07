import { Modal, Form, Button, Accordion, Card } from "react-bootstrap";
import { Edit, Trash2 } from "lucide-react";

export function WorkflowModalRenderer(props) {
  return (
    <Modal
      size="lg"
      show={props.isOpen}
      onShow={props.onShow}
      centered
      onHide={props.onHide}
      onExit={props.onExit}
    >
      <Modal.Header closeButton>
        {props.isEdit ? "Edit" : "New"} Workflow
      </Modal.Header>
      <Modal.Body>

        {props.children}

        <Form>
          <div>
            <Form.Label>Workflow Name</Form.Label>
            <Form.Control
              required
              onChange={props.onNameChange}
              defaultValue={props.nameDefaultValue}
            />
            <Form.Label>Workflow Description</Form.Label>
            <Form.Control
              required
              onChange={props.onDescriptionChange}
              defaultValue={props.descriptionDefaultValue}
            />
            <Form.Label>Workflow Tags (Seperate by commas)</Form.Label>
            <Form.Control
              required
              onChange={props.onTagsChange}
              defaultValue={props.tagsDefaultValue}
            />
            {props.children}
          </div>

          <div className="flex pt-2 justify-end">
            <Button
              type="submit"
              onClick={props.onSubmit}
            >
              {props.isEdit ? "Submit" : "Add Workflow"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export function ActionModalRenderer(props) {
    return (
    <Modal size="lg" centered show={props.isOpen} onShow={props.onShow} 
    onHide={props.onHide} onExit={props.onExit}>
        <Modal.Header closeButton>{props.isEdit ? 'Edit' : 'New'} Action</Modal.Header>
        <Modal.Body>
            {props.children}

            <Form>
                <Form.Label>Action Name</Form.Label>
                <Form.Control required onChange={props.onNameChange} defaultValue={props.nameDefaultValue}/>

                <Form.Label>Action Description</Form.Label>
                <Form.Control required onChange={props.onDescriptionChange} defaultValue={props.descriptionDefaultValue}/>

                
                {!props.isEdit ? // I refuse to let the user edit the action type. That would cause so many problems (e.g. complex => simple).
                <><Form.Label>Action Type</Form.Label>
                <Form.Select onChange={props.onActionTypeChange}>
                    <option key="simple" value="simple">Simple</option>
                    {/* it's tested you can make up to 7 children before the workflows API fails to return. Though it says 6 in reality it is indeed 7 layers */}
                    <option key="complex" value="complex" disabled={props.disabled}>Complex</option>
                    <option key="workflow" value="workflow" disabled={props.disabled}>Workflow</option>
                </Form.Select>
                </>
                : <></>}   
                {props.actionType === "simple" ?
                <> {props.extendedSimpleRender} </> : <></>}
                <div className="flex justify-end pt-2">
                    <Button disabled={props.loading} type="submit" onClick={props.onSubmit}>{props.isEdit ? 'Edit' : 'Add'} action</Button>
                </div>
                
            </Form>
        </Modal.Body>
    </Modal>
    )
}

export function DeleteModalRenderer(props){
    return (
    <Modal centered show={props.isOpen} onHide={props.onHide} onExit={props.onExit}>
        <Modal.Header>Delete Action</Modal.Header>
        <Modal.Body>
            <div className="alert alert-danger">
                <p>You are about to permanently delete a{props.action?.attributeId ? ' workflow' : 'n action'}!</p> 
                <p>Are you sure you'd like to delete "{props.action?.name}"? This cannot be undone!</p>
            </div>
            <div className="flex justify-between pt-4">
                <Button onClick={props.onCancel}>Cancel</Button>
                <Button variant="danger" className="justify-end" onClick={props.onSubmit}>Confirm</Button>
            </div>
        </Modal.Body>
    </Modal>
    )
}

// export function WorkflowComponentRenderer(props){
//     return (
//         <>
//         <Accordion.Item eventKey={props.workflowId}>
//             <Accordion.Header className="w-full">
//                 <div className="flex w-full justify-between">
//                     <span className="text-4xl">{props.workflowName} 
//                         {props.workflows[props.index]?.metadata?.code === "None" ? "(Inactive)" 
//                         : (props.workflows[props.index]?.metadata?.code ? `(${props.workflows[props.index]?.metadata?.code})` : '')}</span>
//                     <div className="mr-4">
//                         <Button className="justify-end" variant="outline-dark" 
//                         onClick={props.onWorkflowEdit}><Edit /></Button>
//                         <Button variant="outline-danger" className="ml-2" onClick={props.onWorkflowDelete}><Trash2 /></Button>
//                     </div>            
//                 </div>
//             </Accordion.Header>
//             <Accordion.Body>
//                 <div className="text-3xl">
//                     <p>Description: {props.workflowDescription}</p>
//                 </div>
//                 <div className="text-2xl">
//                     Tags: {props.workflowTags}
//                 </div>
//                 {(props.actions || []).map(action => {
//                     action = action?.action;
//                     let value;
//                     if (!action.parentActionId)
//                     switch (action.actionType) {
//                         case "simple":
//                             value = <Card className="border-2 mt-2">
//                                 <Card.Header className="text-xl">
//                                     <div className="flex justify-between">
//                                     <span>{action.name} (Simple Action)</span>
//                                     <div>
//                                         <Button variant="outline-secondary" onClick={() => {
//                                             setCurAction(action);
//                                             setIsOpen(true);
//                                             setIsEdit(true);
//                                         }}><Edit /></Button>
//                                         <Button variant="outline-danger" className="ml-2" onClick={()=> {
//                                             setCurAction(action);
//                                             setDeleteOpen(true);
//                                         }}><Trash2 /></Button>
//                                     </div>
//                                     </div>
//                                     </Card.Header>
//                                 <Card.Body>
//                                     <div><p>Description: {action.description}</p></div>
//                                     {simpleExtraDataRenderer(action)}
//                                 </Card.Body>
//                             </Card>
//                             break;
//                         case "workflow": // basically the same as a complex action
//                         case "complex":
//                             value = 
//                             <Accordion className="mt-2">
//                                 <Accordion.Item eventKey={action.id}>
//                                 <Accordion.Header className="w-full">
//                                     <div className="flex w-full justify-between">
//                                     <span className="text-3xl">{action.name} {action.actionType === 'complex' ? '(Complex Action)' : '(Workflow)'}</span>
//                                     <div className="mr-4">
//                                     <Button className="justify-end" variant="outline-dark" 
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         setIsEdit(true);
//                                         setCurAction(action);
//                                         setIsOpen(true);
//                                     }}><Edit /></Button>
//                                     <Button variant="outline-danger" className="ml-2" onClick={(e) => {
//                                         e.stopPropagation();
//                                         setCurAction(action);
//                                         setDeleteOpen(true);
//                                     }}><Trash2 /></Button>
//                                     </div>
//                                     </div>
//                                 </Accordion.Header>
//                                 <Accordion.Body>
//                                     <div className="text-2xl"><p>Description: {action.description}</p></div>
//                                     <ComplexRenderer 
//                                     workflows={workflows}
//                                     index={index}
//                                     actions={action.childActions}
//                                     setIsOpen={setIsOpen} 
//                                     setParentId={setParentId}
//                                     depthLevel={depthLevel+1}
//                                     setDepthLevel={setDepthLevel}
//                                     setCurAction={setCurAction}
//                                     setIsEdit={setIsEdit}
//                                     setDeleteOpen={setDeleteOpen}
//                                     simpleExtraDataRenderer={simpleExtraDataRenderer}/>
//                                     <div className="flex justify-end pt-3">
//                                         <Button onClick={()=>{setIsOpen(true);setParentId(action.id);setDepthLevel(depthLevel+1);}}>Add New Child Action</Button>
//                                     </div>
//                                 </Accordion.Body>
//                             </Accordion.Item>
//                             </Accordion>
//                             break;
//                         default:
//                             value = <p>Unknown Type {action.actionType}</p>
//                             break;
//                     }
//                     return value;
//                 })}
//                 <div className="flex justify-end pt-3">
//                     <Button onClick={props.onAddAction}>Add New Action</Button>
//                 </div>
//             </Accordion.Body>
//         </Accordion.Item>
//         </>
//     )
// }

export function ErrorRenderer(error){
    return (
        <div className="alert alert-danger"> {error} </div>
    )
}