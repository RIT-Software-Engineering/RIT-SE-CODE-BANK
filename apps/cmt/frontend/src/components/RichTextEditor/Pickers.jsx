import { Eraser } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Button } from "react-bootstrap"
import { ColorWheel } from "../../pages/course/CourseOverview.jsx"
import { ColorOption } from "../forms/ColorPicker.jsx"

export function TextPicker({ editor }) {
  return <EditorPicker editor={editor} attributeName={"textStyle"} applyChange={color => editor.chain().focus().setColor(color).run()} />
}

export function HighlightPicker({ editor }) {
  return <EditorPicker
    editor={editor}
    attributeName={"highlight"}
    applyChange={color => {
        if (!color) editor.chain().focus().unsetHighlight().run()
        else editor.chain().focus().setHighlight({ color }).run()
  }}/>
}


function EditorPicker({ editor, attributeName, applyChange }) {
  const [color, setColor] = useState("")
  const [showWheel, setShowWheel] = useState(false)

  const colors = useMemo(() => ["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#0484c9", "#405cc9", "#88e4bd", "#76d380"], [])

  const handleColorChange = color => {
    setColor(colors.includes(color) || color === "" ? color : "rainbow")
    applyChange(color)
  }
  
  useEffect(() => {
    const updateColorFromSelection = () => {
      const selectedColor = editor.getAttributes(attributeName).color
      setColor(selectedColor
        ? colors.includes(selectedColor) ? selectedColor : "rainbow"
        : ""
      )
    }

    editor.on("selectionUpdate", updateColorFromSelection)
    return () => editor.off("selectionUpdate", updateColorFromSelection)
  }, [attributeName, colors, editor])

  return (
    // TODO: This removes the color wheel's ability to drag, but prevents the RTE from unselecting the text if you drag. Fixing this would be nice
    <div className="p-3 border-x border-b" onMouseDown={e => e.stopPropagation()} onMouseMove={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()}>
      <div className="flex gap-2 items-center">
        <Button variant="outline-secondary" onClick={() => handleColorChange("")}>
          <Eraser />
        </Button>
        {["#ff9749", "#ee605c", "#e64980", "#cb2d6a", "#0484c9", "#405cc9", "#88e4bd", "#76d380", "rainbow"].map(
          hex => (
            <ColorOption
              key={hex}
              color={color}
              setColor={handleColorChange}
              hex={hex}
              setShowWheel={setShowWheel}
            />
          )
        )}
      </div>

      {showWheel && (
        <div className="mb-3">
          <ColorWheel setColor={handleColorChange} />
        </div>
      )}
    </div>
  )
}