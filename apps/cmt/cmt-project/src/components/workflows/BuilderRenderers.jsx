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

            {props.extraRendering}
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
    onHide={props.onHide}>
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
                <p>You are about to permanently delete a{props.action.attributeId ? ' workflow' : 'n action'}!</p> 
                <p>Are you sure you'd like to delete "{props.action.name}"? This cannot be undone!</p>
            </div>
            <div className="flex justify-between pt-4">
                <Button onClick={props.onCancel}>Cancel</Button>
                <Button variant="danger" className="justify-end" onClick={props.onSubmit}>Confirm</Button>
            </div>
        </Modal.Body>
    </Modal>
    )
}

export function WorkflowComponentRenderer(props) {
    return (
        <>
        <Accordion.Item eventKey={props.workflow.id}>
            <Accordion.Header className="w-full">
                <div className="flex w-full justify-between">
                    <span className="text-4xl">{props.workflow.name} 
                        {props.workflow.metadata?.code === "None" ? " (Inactive)" 
                        : (props.workflow.metadata?.code ? ` (${props.workflow.metadata?.code})` : '')}</span>
                    <div className="mr-4">
                        <Button className="justify-end" variant="outline-dark" 
                        onClick={props.onWorkflowEdit}><Edit /></Button>
                        <Button variant="outline-danger" className="ml-2" onClick={props.onWorkflowDelete}><Trash2 /></Button>
                    </div>            
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="text-3xl">
                    <p>Description: {props.workflow.description}</p>
                </div>
                <div className="text-2xl">
                    Tags: {props.workflow.tags.length > 0 ? props.workflow.tags.join(', '): "None"}
                </div>

                {props.children}
                
                <div className="flex justify-end pt-3">
                    <Button onClick={props.onAddActionRoot}>Add New Action</Button>
                </div>
            </Accordion.Body>
        </Accordion.Item>
        </>
    )
}

export function SimpleActionRenderer(props) {
  return (
  <Card className="border-2 mt-2">
      <Card.Header className="text-xl">
        <div className="flex justify-between">
          <span>{props.name} (Simple Action)</span>
          <div>
              <Button variant="outline-secondary" onClick={() => {
                props.setCurAction(props.action);
                props.onActionEdit();
                }}><Edit /></Button>
              <Button variant="outline-danger" className="ml-2" onClick={() => {
                props.setCurAction(props.action);
                props.onActionDelete();
              }}><Trash2 /></Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
          <div><p>Description: {props.description}</p></div>
          <div>
            <p>Code: {props.action.metadata.code}</p>
            {(props.action.metadata.outputs||[]).map(output => {
                return (<>
                    <p>Required? {output.isRequired ? 'Yes' : 'No'}</p>
                    {output.key? <p>Key: {output.key}</p> : <></>}
                    {output.name? <p>Name: {output.name}</p> : <></>}
                    {output.type? <p>Type: {output.type}</p> : <></>}
                    {output.placeholder ? <p>Placeholder: {output.placeholder}</p> : <></>}
                    {output.validation && Object.keys(output.validation).map(key => {
                        const value = output.validation;
                        const displayValue = (output.validation.options) ? value.options.join(', ') : value[key];
                        return <p key={key}>{key}: {displayValue}</p>;
                    })}
                </>)
            })}
        </div>
      </Card.Body>
  </Card>
  )
}

export function ComplexActionRenderer(props) {
  return (
    <Accordion className="mt-2">
      <Accordion.Item eventKey={props.action.id}>
      <Accordion.Header className="w-full">
          <div className="flex w-full justify-between">
          <span className="text-3xl">{props.name} {props.action.actionType === 'complex' ? '(Complex Action)' : '(Workflow)'}</span>
          <div className="mr-4">
          <Button className="justify-end" variant="outline-dark" 
          onClick={(e) => {
              e.stopPropagation();
              props.setCurAction(props.action);
              props.onActionEdit();
          }}><Edit /></Button>
          <Button variant="outline-danger" className="ml-2" onClick={(e) => {
              e.stopPropagation();
              props.setCurAction(props.action);
              props.onActionDelete();
          }}><Trash2 /></Button>
          </div>
          </div>
      </Accordion.Header>
      <Accordion.Body>
          <div className="text-2xl"><p>Description: {props.description}</p></div>
          {(props.action.childActions || []).map(action => {
            let value;
            switch (action.actionType) {
                case "simple":
                    value = 
                    <SimpleActionRenderer 
                        name={action.name}
                        description={action.description}
                        action={action}

                        setCurAction={props.setCurAction}
                        onActionEdit={props.onActionEdit}
                        onActionDelete={props.onActionDelete}
                    />
                    break;
                case "workflow": // basically the same as a complex action
                case "complex":
                    value = 
                    <ComplexActionRenderer 
                        action={action}
                        name={action.name}
                        description={action.description}
                        depthLevel={props.depthLevel+1}

                        setCurAction={props.setCurAction}
                        setDepthLevel={props.setDepthLevel}
                        setParentId={props.setParentId}

                        onActionEdit={props.onActionEdit}
                        onActionDelete={props.onActionDelete}

                        onAddActionChild={props.onAddActionChild}
                    >
                    </ComplexActionRenderer>
                    break;
                default:
                    value = <p>Unknown Type {action.actionType}</p>
                    break;
            }
            return value;
        })}
          <div className="flex justify-end pt-3">
              <Button onClick={() => {
                props.setParentId(props.action.id);
                props.setDepthLevel(props.depthLevel+1)
                props.onAddActionChild();
              }}>Add New Child Action</Button>
          </div>
    </Accordion.Body>
    </Accordion.Item>
  </Accordion>
  )
}

export function ErrorRenderer(error){
    return (
        <div className="alert alert-danger"> {error} </div>
    )
}