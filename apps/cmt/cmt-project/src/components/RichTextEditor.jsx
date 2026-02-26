import { EditorContent, useEditor, } from "@tiptap/react";
import {StarterKit} from "@tiptap/starter-kit";
import { ButtonGroup, Button, Accordion } from "react-bootstrap";
import {
  Baseline,
  Bold,
  Code,
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
import { useCallback, useEffect, useState } from "react";
import { TableKit } from '@tiptap/extension-table'
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';

export function RichTextEditor({ value, onChange }) {
  
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
    content: value || "Add content!",
    onUpdate: ({ editor }) => {
      onChange && onChange(editor.getHTML());
    },
  });

  // Used purely just to update button state correctly when pressed or keyboard shortcut
  const [x, setRerender] = useState(0);
  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', () => {
      setRerender( x + 1); 
    });

    editor.on('transaction', () => {
      setRerender( x + 1);
    });
  }, [x, editor]);

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
      <div className="border pl-2 prose w-full">
        <EditorContent editor={editor}/>
      </div>
    </div>
  );
}