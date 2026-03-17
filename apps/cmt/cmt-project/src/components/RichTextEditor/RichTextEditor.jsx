import { Editor, EditorContent, useEditor, } from "@tiptap/react";
import Highlight from '@tiptap/extension-highlight'
import {StarterKit} from "@tiptap/starter-kit";
import { ButtonGroup, Button, Tooltip, OverlayTrigger, Dropdown, Modal, Form } from "react-bootstrap";
import {
  Baseline,
  Bold,
  Code,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  PaintBucket,
  Table,
  TextAlignCenter,
  Underline,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TableKit } from '@tiptap/extension-table'
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { ResourceLinkModal } from "./ResourceLinkModal";
import { HighlightPicker, TextPicker } from "./Pickers";


export function ReadOnlyEditor({ value }) {
    const editor = new Editor({
        editable: false,
        content: value,
        editorProps: {
            attributes: {
                spellcheck: 'true',
            },
        },
        extensions: [
            StarterKit,
            TableKit.configure({
                table: { resizable: true },
                
            }),
            TextStyle,
            Highlight.configure({ multicolor: true }),
            Color,
            BackgroundColor,
            TextAlign.configure({
                alignments: ['left', 'center'],
                types: ['paragraph', 'heading'],
            }),
        ],
    })
    return <EditorContent className="*:pl-2 pt-2" editor={editor} /> 
}

/**
 * @param {{ value: any, onChange: function, courseId: number, showTables: boolean }} props 
 */
export function RichTextEditor({ value, onChange, courseId, showTables }) {

  const Extras = {
    Table: "Table",
    HighlightPicker: "Highlight Picker",
    TextPicker: "Text Picker",
    None: "None",
  }
  const [extraToShow, setExtraToShow] = useState(Extras.None)

    const editor = useEditor({
        editorProps: {
            attributes: {
              spellcheck: 'true',
            },
        },
        extensions: [
            StarterKit,
            TableKit.configure({
                table: { resizable: true },
            }),
            TextStyle,
            Highlight.configure({ multicolor: true }),
            Color, // The current colors are very limited to basically the defaults. Maybe this could be changed in the future?
            BackgroundColor,
            TextAlign.configure({
                alignments: ['left', 'center'],
                types: ['paragraph', 'heading'],
            }),
        ],
        onUpdate: ({ editor }) => {
            onChange && onChange(editor.getHTML())
        },
    })

    // Used purely just to update button state correctly when pressed or keyboard shortcut
    const [, setRerender] = useState(0)
    useEffect(() => {
        if (!editor) return

        const handleUpdate = () => {
            setRerender(prev => prev + 1)
        }

        editor.on('selectionUpdate', handleUpdate)
        editor.on('transaction', handleUpdate)

        return () => {
            editor.off('selectionUpdate', handleUpdate)
            editor.off('transaction', handleUpdate)
        }
    }, [editor])

    useEffect(() => {
        if (editor && value !== editor.getHTML() && value) {
            editor.commands.setContent(value)
        }
    }, [value, editor])

    return (
        <div className="flex flex-col">
                  
          <ButtonGroup className='*:!rounded-none *:!flex *:!justify-center'>
              <Button variant='outline-secondary' active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                  <Bold />
              </Button>

              <Button variant='outline-secondary' active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                  <Italic />
              </Button>

              <Button variant='outline-secondary' active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                  <Underline />
              </Button>

              <Button variant='outline-secondary' active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                  <List />
              </Button>

              <Button variant='outline-secondary' active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                  <ListOrdered />
              </Button>

              
              <OverlayTrigger delay={200} overlay={<Tooltip>tooled tip</Tooltip>}>
                <Button variant='outline-secondary' active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                    <Code /> {/* TODO: make sure this darn thing renders properly in both the editor and in read only editors */}
                </Button>
              </OverlayTrigger>

              <Button
                  variant='outline-secondary'
                  active={extraToShow === Extras.TextPicker || editor.isActive('textStyle')}
                  onClick={e => { e.stopPropagation(); setExtraToShow(current => current === Extras.TextPicker ? Extras.None : Extras.TextPicker) }}
                  className="group"
              >
                <div className="flex flex-col items-center">
                  <Baseline />
                  {extraToShow === Extras.TextPicker && <div className="w-full border-b-4 border-b-gray-300 -mb-2 group-hover:border-b-gray-100 duration-200" />}
                </div>
              </Button>

              <Button
                  variant='outline-secondary'
                  active={extraToShow === Extras.HighlightPicker || editor.isActive('highlight')}
                  onClick={e => { e.stopPropagation(); setExtraToShow(current => current === Extras.HighlightPicker ? Extras.None : Extras.HighlightPicker) }}
                  className="group"
              >
                <div className="flex flex-col items-center">
                  <PaintBucket />
                  {extraToShow === Extras.HighlightPicker && <div className="w-full border-b-4 border-b-gray-300 -mb-2 group-hover:border-b-gray-100 duration-200" />}
                </div>
              </Button>

              <Dropdown as={ButtonGroup} className="grow">
                <Dropdown.Toggle
                  variant="outline-secondary"
                  active={editor.isActive("heading")}
                >
                  <Heading className="inline-block" />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 /></Dropdown.Item>
                  <Dropdown.Item eventKey="2" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading2 /></Dropdown.Item>
                  <Dropdown.Item eventKey="3" active={editor.isActive('heading', { level: 5 })} onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}><Heading3 /></Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Button
                variant="outline-secondary"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().toggleTextAlign("center").run()}
              >
                <TextAlignCenter className="inline-block" />
              </Button>

              <ResourceLinkModal courseId={courseId} editor={editor} />

              <ExternalLinkModal editor={editor} />

              <Button
                  variant='outline-secondary'
                  onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      if (!editor.isActive('textStyle', { color: '#0484c9' }) && !editor.isActive('textStyle', { backgroundColor: '#0484c9' })) editor.chain().focus().setColor('black').run()
                      else if (editor.isActive('textStyle', { color: '#0484c9' })) editor.chain().focus().setColor('#0484c9').run()
                      else if (editor.isActive('textStyle', { backgroundColor: '#0484c9' })) editor.chain().focus().setColor('white').run()
                  }}
              >
                  <Link2Off />
              </Button>

              {showTables && 
                <Button variant="outline-secondary" onClick={() => setExtraToShow(current => current === Extras.Table ? Extras.None : Extras.Table)}>
                  <Table />
                </Button>
              }
          </ButtonGroup>
          {extraToShow === Extras.Table 
            ? <ButtonGroup className='*:!rounded-none *:!border-t-0'>
              <Button variant='light' onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                  Add Table
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().addRowBefore().run()}>
                  Insert Row Before
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().addRowAfter().run()}>
                  Insert Row After
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().addColumnBefore().run()}>
                  Insert Column Before
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  Insert Column After
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().deleteRow().run()}>
                  Delete Row
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().mergeCells().run()}>
                  Merge Cells
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().deleteColumn().run()}>
                  Delete Column
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().deleteTable().run()}>
                  Delete Table
              </Button>
          </ButtonGroup>
          : extraToShow === Extras.HighlightPicker
          ? <HighlightPicker editor={editor} />
          : extraToShow === Extras.TextPicker
          ? <TextPicker editor={editor} />
          : <></>
          }
          
          <div className='border-x border-b p-3 prose max-w-none'>
              <EditorContent className="*:p-3" editor={editor} />
          </div>
        </div>
    )
}

export function ExternalLinkModal({ editor }) {
    const [show, setShow] = useState(false)

    const [linkText, setLinkText] = useState('')
    const [linkURL, setLinkURL] = useState('')

    const handleInsert = () => {

        const displayText = linkText.trim() || linkURL

        editor.chain().focus().extendMarkRange('link').setLink({ href: linkURL, target: '_blank' }).run()

        // Replace the selected text with the display text
        if (displayText && displayText !== editor.getHTML()) {
            editor.chain().focus().insertContent(displayText).run()
        }

        // Set color
        if (!editor.isActive('textStyle', { color: '#0484c9' }) && !editor.isActive('textStyle', { backgroundColor: '#0484c9' }))
            editor.chain().focus().setColor('#0000FF').run()

        handleReset()
    }

    const handleReset = () => {
        setShow(false)
        setLinkText('')
        setLinkURL('')
    }

    return (<>
        <Button
            variant='outline-secondary'
            onClick={() => setShow(true)}
            >
                <Link2/>
        </Button>

        <Modal show={show} onHide={handleReset} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Insert Resource Link</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-4">
                    <Form.Group>
                        <Form.Label>Link URL</Form.Label>
                        <Form.Control
                            type='text'
                            placeholder={`https://www.google.com`}
                            value={linkURL}
                            onChange={e => setLinkURL(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Link Display Text</Form.Label>
                        <Form.Control
                            type='text'
                            placeholder={`This text will be what the link appears as.`}
                            value={linkText}
                            onChange={e => setLinkText(e.target.value)}
                        />
                    </Form.Group>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='secondary' onClick={handleReset}>
                    Cancel
                </Button>
                <Button variant='primary' onClick={handleInsert} disabled={!linkURL}>
                    Insert Link
                </Button>
            </Modal.Footer>
        </Modal>
    </>)
}



