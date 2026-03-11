import { EditorContent, useEditor, } from "@tiptap/react";
import {StarterKit} from "@tiptap/starter-kit";
import { ButtonGroup, Button, Accordion, Modal, Spinner, Form, Row, Col, Card, Popover, Overlay } from "react-bootstrap";
import {
  Baseline,
  Bold,
  Code,
  FileSymlink,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  PaintbrushVertical,
  PaintBucket,
  TextAlignJustify,
  Underline,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TableKit } from '@tiptap/extension-table'
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { CMTJsonFetch } from "../utils/api";
import { getResourceDownloadUrl } from "./resources/ResourceManager";
import { SelectableResourceCard } from "./resources/resourceRenderers";

export function RichTextEditorController({ value, onChange, courseId }) {
    const [step, setStep] = useState("main");

    <Modal>
        <Modal.Body>
            {step === "main" && <MainStep goConfirm={() => setStep("confirm")} />}
            {step === "confirm" && <ConfirmStep goBack={() => setStep("main")} />}
        </Modal.Body>
    </Modal>
}

function MainStep({ goConfirm }) {
  return <Button onClick={goConfirm}>Delete</Button>;
}

function ConfirmStep({ goBack }) {
  return <Button onClick={goBack}>Back</Button>;
}

export function RichTextEditor({ value, onChange, courseId }) {
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TableKit.configure({
        table: {resizable:true}
      }),
      TextStyle,
      Color, // The current colors are very limited to basically the defaults. Maybe this could be changed in the future?
      BackgroundColor,
      TextAlign.configure({
        alignments: ['left', 'center'],
        types: ['paragraph', 'heading']
      })
    ],
    onUpdate: ({ editor }) => {
      onChange && onChange(editor.getHTML());
    },
  });

  // Used purely just to update button state correctly when pressed or keyboard shortcut
  const [_, setRerender] = useState(0);
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setRerender(prev => prev + 1);
    }
    
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    }

  }, [editor]);

  useEffect(() => {
  if (editor && value !== editor.getHTML() && value) {
    editor.commands.setContent(value);
  }
  else if (!value) editor.commands.setContent("Add content here!")
  }, [value, editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    // This could maybe be changed into a modal or something in the future? We don't want a double-modal though
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    try {
      // TODO add checkbox in future for user to select whether the link opens in a new tab or the same tab
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
      if (!editor.isActive("textStyle", {color: '#0484c9'}) && !editor.isActive("textStyle", {backgroundColor: '#0484c9'}))
        editor.chain().focus().setColor('#0000FF').run();
    } catch (e) {
      alert(e.message);
    }
  }, [editor]);

  return (
    <div>
      {/* Toolbar */}
      <Accordion className="mb-3" alwaysOpen>
        <Accordion.Item eventKey="0">
          <Accordion.Header>Standard Toolbar</Accordion.Header>
          <Accordion.Body className="overflow-x-scroll">
            <ButtonGroup>
              <Button
                variant="outline-dark"
                active={editor.isActive("bold")}
                className={editor.isActive("bold") ? 'is-active' : ''}
                onClick={() => editor.chain().focus().toggleBold().run()}
              ><Bold /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              ><Italic /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              ><Underline /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              ><List /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              ><ListOrdered /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("codeBlock")}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              ><Code /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("textStyle", {color: '#0484c9'})}
                onClick={() => {
                  if (!editor.isActive("textStyle", {color: '#0484c9'})){
                  editor.chain().focus().setColor('#0484c9').run(); 
                  editor.chain().focus().unsetBackgroundColor().run();
                  }
                  else {
                    editor.chain().focus().setColor(editor.isActive('link') ? '#0000FF' : 'black').run();
                  }
                  }}
              ><Baseline /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("textStyle", {backgroundColor: '#0484c9'})}
                onClick={() => {
                  if (!editor.isActive("textStyle", {backgroundColor: '#0484c9'})){
                    editor.chain().focus().setBackgroundColor('#0484c9').run(); 
                    editor.chain().focus().setColor('white').run();
                  }
                  else {
                    editor.chain().focus().setBackgroundColor('#00000000').run(); 
                    editor.chain().focus().setColor(editor.isActive('link') ? '#0000FF' : 'black').run();
                  }
                }}
              ><PaintBucket /></Button>
              
              <Button
                variant="outline-dark"
                onClick={() => {editor.chain().focus().unsetColor().run(); editor.chain().focus().unsetBackgroundColor().run()}}
              ><PaintbrushVertical /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("heading", {level:1})}
                onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
              ><Heading1 /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("heading", {level: 2})}
                onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
              ><Heading2 /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("heading", {level:3})}
                onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
              ><Heading3 /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive({textAlign: 'center'})}
                onClick={() => {
                  editor.chain().focus().toggleTextAlign('center').run();
                }}
              ><TextAlignJustify /></Button>

              <Button
                variant="outline-dark"
                active={editor.isActive("link")}
                onClick={setLink}
              ><Link2 /></Button>

              <LinkResourcePopover courseId={courseId} editor={editor}/>

              <Button
                variant="outline-dark"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  if (!editor.isActive("textStyle", {color: '#0484c9'}) && !editor.isActive("textStyle", {backgroundColor: '#0484c9'}))
                    editor.chain().focus().setColor('black').run();
                  else if (editor.isActive("textStyle", {color: '#0484c9'}))
                    editor.chain().focus().setColor('#0484c9').run();
                  else if (editor.isActive("textStyle", {backgroundColor: '#0484c9'}))
                     editor.chain().focus().setColor('white').run();
                }}
              ><Link2Off /></Button>
            </ButtonGroup>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1">
          <Accordion.Header>Table Toolbar</Accordion.Header>
          <Accordion.Body className="overflow-x-scroll">
            <ButtonGroup>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().insertTable({rows:3, cols:3, withHeaderRow:true}).run()}
              >
              Add Table
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().addRowBefore().run()}
              >
              Insert Row Before
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().addRowAfter().run()}
              >
              Insert Row After
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().addColumnBefore().run()}
              >
              Insert Column Before
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().addColumnAfter().run()}
              >
              Insert Column After
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().deleteRow().run()}
              >
              Delete Row
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().mergeCells().run()}
              >
              Merge Cells
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().deleteColumn().run()}
              >
              Delete Column
              </Button>
              <Button
              variant="outline-dark"
              onClick={()=>editor.chain().focus().deleteTable().run()}
              >
              Delete Table
              </Button>
            </ButtonGroup>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {/* Editor */}
      <div className="border pl-2 prose min-w-full overflow-y-scroll max-h-96">
        <EditorContent editor={editor} className="h-full"/>
      </div>
    </div>
  );
}

function LinkResourcePopover({ editor, courseId, modalRef }) {
    const [show, setShow] = useState(false)

    const [resources, setResources] = useState([])
    const [selectedResource, setSelectedResource] = useState(null)
    const [linkText, setLinkText] = useState('')
    const [loading, setLoading] = useState(false)

    const loadResources = useCallback(async () => {
        setLoading(true)

        CMTJsonFetch('GET', `resources/${courseId}`)
            .then(async response => setResources((await response.json()) || []))
            .catch(error => {
                console.error('Failed to load resources', error)
            }) // TODO: central error notifs
            .finally(() => setLoading(false))
    }, [courseId])

    const handleInsert = () => {
        if (!selectedResource) {
            return
        }

        const displayText = linkText.trim() || selectedResource.name
        const linkUrl = getResourceDownloadUrl(selectedResource.id)

        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl, target: '_blank' }).run()

        // Set the display text if provided
        if (displayText && displayText !== editor.getHTML()) {
            // Replace the selected text with the display text
            editor.chain().focus().insertContent(displayText).run()
        }

        // Set color to blue for consistency with external links
        if (!editor.isActive('textStyle', { color: '#0484c9' }) && !editor.isActive('textStyle', { backgroundColor: '#0484c9' }))
            editor.chain().focus().setColor('#0000FF').run()

        handleReset()
    }

    const handleReset = () => {
        setShow(false)
        setSelectedResource(null)
        setLinkText('')
    }

    useEffect(() => {
        if (courseId) loadResources()
    }, [courseId, loadResources])

    const overlayRef = useRef(null)

    return (
        <>
                <Button
                    variant='outline-dark'
                    onClick={() => setShow(true)}
                    ref={overlayRef}
                    >
                    <FileSymlink />
                </Button>

                {/* <Overlay target={overlayRef.current} show={show} placement="right">
                    {({
                    placement: _placement,
                    arrowProps: _arrowProps,
                    show: _show,
                    popper: _popper,
                    hasDoneInitialMeasure: _hasDoneInitialMeasure,
                    ...props
                    }) => (
                    <div
                        {...props}
                        style={{
                        zIndex: 2000, // React bootstraps default for modals is like 1080 or smthn so we gotta pick something really high
                        backgroundColor: 'rgba(255, 100, 100, 0.85)',
                        padding: '2px 10px',
                        color: 'white',
                        borderRadius: 3,
                        ...props.style,
                        }}
                    >
                        Simple tooltip
                    </div>
                    )}
                </Overlay> */}

                <Modal target={overlayRef} show={show} onHide={handleReset} size='lg'>
                    <Modal.Header closeButton>
                        <Modal.Title>Insert Resource Link</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loading ? (
                            <div className='text-center'>
                                <Spinner animation='border' />
                            </div>
                        ) : resources.length === 0 ? (
                            <div className='text-center text-muted'>
                                <p>No resources found for this course.</p>
                                <p>Upload resources in the course dashboard to use them here.</p>
                            </div>
                        ) : (
                            <>
                                <Form.Group className='mb-3'>
                                    <Form.Label>Select Resource</Form.Label>
                                    <Row>
                                        {resources.map(resource => (
                                            <Col md={6} lg={4} key={resource.id} className='mb-3'>
                                                <SelectableResourceCard refresh={loadResources} resource={resource} selected={selectedResource} setSelected={setSelectedResource}/>
                                            </Col>
                                        ))}
                                    </Row>
                                </Form.Group>

                                {selectedResource && (
                                    <Form.Group className='mb-3'>
                                        <Form.Label>Link Display Text</Form.Label>
                                        <Form.Control
                                            type='text'
                                            placeholder={`${selectedResource.name}`}
                                            value={linkText}
                                            onChange={e => setLinkText(e.target.value)}
                                        />
                                        <Form.Text className='text-muted'>
                                            This is the text that will be displayed as the clickable link
                                        </Form.Text>
                                    </Form.Group>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='secondary' onClick={handleReset}>
                            Cancel
                        </Button>
                        <Button variant='primary' onClick={handleInsert} disabled={!selectedResource || loading}>
                            Insert Link
                        </Button>
                    </Modal.Footer>
                </Modal>

        </>
    )
}