import { EditorContent, findParentNode, posToDOMRect, useEditor, } from "@tiptap/react";
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
  Table,
  TextAlignCenter,
  Underline,
  Highlighter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { TableKit } from '@tiptap/extension-table'
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { ResourceLinkModal } from "./ResourceLinkModal.jsx";
import { HighlightPicker, TextPicker } from "./Pickers.jsx";
import { BubbleMenu } from '@tiptap/react/menus'
import { Link } from "react-router-dom";

// This is to prevent rerenders that would be caused by inline definitions.
// I believe the setRerender call has to do with it as well.
// An alternative to this is a useMemo, since all we really want is for tooltip definitions to be stable.
// There are better ways to do this, but we're low on time (:
const TOOLTIP_OVERLAYS = {
    bold: <Tooltip id="rte-bold-tooltip">Bold</Tooltip>,
    italic: <Tooltip id="rte-italic-tooltip">Italics</Tooltip>,
    underline: <Tooltip id="rte-underline-tooltip">Underline</Tooltip>,
    code: <Tooltip id="rte-code-tooltip">Code Block</Tooltip>,
    textColor: <Tooltip id="rte-text-color-tooltip">Text Color</Tooltip>,
    highlight: <Tooltip id="rte-highlight-tooltip">Highlight</Tooltip>,
    bulletList: <Tooltip id="rte-bullet-list-tooltip">Dot list</Tooltip>,
    orderedList: <Tooltip id="rte-ordered-list-tooltip">Ordered List</Tooltip>,
    header: <Tooltip id="rte-header-tooltip">Header</Tooltip>,
    centerText: <Tooltip id="rte-center-text-tooltip">Center Text</Tooltip>,
    externalLink: <Tooltip id="rte-external-link-tooltip">Insert External Link</Tooltip>,
    removeLink: <Tooltip id="rte-remove-link-tooltip">Remove Link/Resource</Tooltip>,
    table: <Tooltip id="rte-table-tooltip">Table</Tooltip>,
}

const emptyToolbarState = {
    bold: false,
    italic: false,
    underline: false,
    code: false,
    textStyle: false,
    highlight: false,
    bulletList: false,
    orderedList: false,
    heading: false,
    heading1: false,
    heading3: false,
    heading5: false,
    centerText: false,
    link: false,
}

function getToolbarState(editor) {
    if (!editor) return emptyToolbarState

    return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        code: editor.isActive('code'),
        textStyle: editor.isActive('textStyle'),
        highlight: editor.isActive('highlight'),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        heading: editor.isActive('heading'),
        heading1: editor.isActive('heading', { level: 1 }),
        heading3: editor.isActive('heading', { level: 3 }),
        heading5: editor.isActive('heading', { level: 5 }),
        centerText: editor.isActive({ textAlign: "center" }),
        link: editor.isActive('link'),
    }
}

function toolbarStateChanged(previous, next) {
    return Object.keys(next).some(key => previous[key] !== next[key])
}

export function ReadOnlyEditor({ value }) {
    const editor = useEditor({
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

    useEffect(() => {
        if (editor && value !== editor.getHTML() && value) {
            editor.commands.setContent(value)
        }
    }, [value, editor])

    return <EditorContent className="*:pl-2 pt-2 prose" editor={editor} /> 
}

/**
 * @param {{ value: any, onChange: function, courseId: number, isBody: boolean, onEditor?: function, disabled?: boolean }} props 
 */
export function RichTextEditor({ value, onChange, courseId, isBody, onEditor, disabled = false }) {

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
            StarterKit.configure({
                link: {
                    openOnClick: false,
                }
            }),
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
        onUpdate: ({ editor }) => {
            onChange && onChange(editor.getHTML())
        },
    })

    const [toolbarState, setToolbarState] = useState(emptyToolbarState)
    useEffect(() => {
        if (!editor) return

        const handleUpdate = () => {
            const nextToolbarState = getToolbarState(editor)
            setToolbarState(previousToolbarState =>
                toolbarStateChanged(previousToolbarState, nextToolbarState)
                    ? nextToolbarState
                    : previousToolbarState
            )
        }

        handleUpdate()

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

    useEffect(() => {
        if (editor && onEditor) {
            onEditor(editor)
        }
    }, [editor, onEditor])

    return (
        <div className="flex flex-col" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
                  
          <ButtonGroup className='*:!rounded-none *:!flex *:!justify-center'>
              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.bold}>
                <Button variant='outline-secondary' active={toolbarState.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.italic}>
                <Button variant='outline-secondary' active={toolbarState.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.underline}>
                <Button variant='outline-secondary' active={toolbarState.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <Underline />
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.code}>
                <Button variant='outline-secondary' active={toolbarState.code} onClick={() => editor.chain().focus().toggleCode().run()}>
                    <Code />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.textColor}>
                <Button
                    variant='outline-secondary'
                    active={extraToShow === Extras.TextPicker || toolbarState.textStyle}
                    onClick={e => { e.stopPropagation(); setExtraToShow(current => current === Extras.TextPicker ? Extras.None : Extras.TextPicker) }}
                    className="group"
                >
                <div className="flex flex-col items-center">
                    <Baseline />
                    {extraToShow === Extras.TextPicker && <div className="w-full border-b-4 border-b-gray-300 -mb-2 group-hover:border-b-gray-100 duration-200" />}
                </div>
                </Button>
              </OverlayTrigger>

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.highlight}>
                <Button
                    variant='outline-secondary'
                    active={extraToShow === Extras.HighlightPicker || toolbarState.highlight}
                    onClick={e => { e.stopPropagation(); setExtraToShow(current => current === Extras.HighlightPicker ? Extras.None : Extras.HighlightPicker) }}
                    className="group"
                >
                <div className="flex flex-col items-center">
                    <Highlighter />
                    {extraToShow === Extras.HighlightPicker && <div className="w-full border-b-4 border-b-gray-300 -mb-2 group-hover:border-b-gray-100 duration-200" />}
                </div>
                </Button>
              </OverlayTrigger>

              {isBody ? 
            <>
              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.bulletList}>
                <Button variant='outline-secondary' active={toolbarState.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.orderedList}>
                <Button variant='outline-secondary' active={toolbarState.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered />
                </Button>
              </OverlayTrigger>
            </>
            : <></>}

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.header}>
                <Dropdown as={ButtonGroup} className="grow">
                    <Dropdown.Toggle
                    variant="outline-secondary"
                    active={toolbarState.heading}
                    >
                    <Heading className="inline-block" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                    <Dropdown.Item eventKey="1" active={toolbarState.heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 /></Dropdown.Item>
                    <Dropdown.Item eventKey="2" active={toolbarState.heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading2 /></Dropdown.Item>
                    <Dropdown.Item eventKey="3" active={toolbarState.heading5} onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}><Heading3 /></Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
              </OverlayTrigger>

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.centerText}>
                <Button
                    variant="outline-secondary"
                    active={toolbarState.centerText}
                    onClick={() => editor.chain().focus().toggleTextAlign("center").run()}
                >
                    <TextAlignCenter className="inline-block" />
                </Button>
              </OverlayTrigger>

              <ResourceLinkModal courseId={courseId} editor={editor} />

              <ExternalLinkModal editor={editor} />

              <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.removeLink}>
                <Button
                    variant='outline-secondary'
                    onClick={() => {
                        if (editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' '))
                            editor.chain().focus().unsetLink().run();
                        else 
                            // AI-generated code
                            // Doesn't unlink whole line, just stops linking after clicking it
                            editor.chain().focus().command(({ tr }) => {
                                tr.removeStoredMark(editor.schema.marks.link)
                                return true
                            }).run();
                        editor.chain().focus().unsetColor().run();
                    }}
                >
                    <Link2Off />
                </Button>
              </OverlayTrigger>

              
              {isBody && 
                <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.table}>
                    <Button variant="outline-secondary" onClick={() => setExtraToShow(current => current === Extras.Table ? Extras.None : Extras.Table)}>
                        <Table />
                    </Button>
                </OverlayTrigger>
              }
          </ButtonGroup>
          {extraToShow === Extras.Table 
            ? <ButtonGroup className='*:!rounded-none *:!border-t-0'>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
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
              <Button variant='outline-dark' onClick={() => editor.chain().focus().mergeCells().run()}>
                  Merge Cells
              </Button>
              <Button variant='outline-dark' onClick={() => editor.chain().focus().deleteRow().run()}>
                  Delete Row
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
          
          <div 
          className='border-x border-b p-3 prose prose-strong:text-inherit max-w-none overflow-y-scroll'
          style={{maxHeight: "35vh"}}>
                <BubbleMenu
                editor={editor}
                shouldShow={() => editor.isActive('link')}
                getReferencedVirtualElement={() => {
                const parentNode = findParentNode(
                    node => {return node.content.firstChild.marks.some(m => m.type.name === 'link')},
                )(editor.state.selection)
                if (parentNode) {
                    const domRect = posToDOMRect(editor.view, 1, parentNode.start)
                    return {
                    getBoundingClientRect: () => domRect,
                    getClientRects: () => [domRect],
                    }
                }
                return null
                }}
                options={{ strategy: "fixed", placement: 'bottom-start'}}
            >
                <div className="bubble-menu">
                    <Link to={editor.getAttributes('link').href}>{editor.getAttributes('link').href}</Link>
                </div>
            </BubbleMenu>
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
        if (!linkURL) return

        const text = linkText?.trim() || linkURL
        const hasHttps = linkURL.startsWith("https");

        // AI-generated code
        editor.chain().focus().insertContent({
            type: 'text', 
            text,
            marks: [
                {
                type: 'link',
                attrs: { href: hasHttps ? linkURL : `https://www.${linkURL}`, target: '_blank' }
                }
            ]
        }).command(({ tr }) => { // turns off link after inserting content
            tr.removeStoredMark(editor.schema.marks.link)
            return true
        }).run()

        handleReset();
    }

    const handleReset = () => {
        setShow(false)
        setLinkText('')
        setLinkURL('')
    }

    const handleShow = () => {
        setLinkURL(editor.getAttributes('link').href);
        setLinkText(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' '));
    }

    return (<>          
        <OverlayTrigger delay={200} overlay={TOOLTIP_OVERLAYS.externalLink}>
            <Button
                variant='outline-secondary'
                onClick={() => setShow(true)}
                active={getToolbarState(editor).link}
                >
                    <Link2/>
            </Button>
        </OverlayTrigger>

        <Modal show={show} onShow={handleShow} onHide={handleReset} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Insert Resource Link</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-4">
                    <Form.Group>
                        <Form.Label>Link URL</Form.Label>
                        <Form.Control
                            type='text'
                            placeholder={`e.g. https://www.google.com`}
                            defaultValue={linkURL}
                            onChange={e => setLinkURL(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Link Display Text</Form.Label>
                        <Form.Control
                            type='text'
                            placeholder={`This text will be what the link appears as.`}
                            defaultValue={linkText}
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



