import Editor from "@monaco-editor/react"

//the code editor! uses monacco but with a custom language (monacco does not support pdp11)
export default function CodeEditor({ code, setCode }) {

  //setting up the custom language settings  
  function handleEditorWillMount(monaco) {

    monaco.languages.register({ id: "pdp11" })

    monaco.languages.setMonarchTokensProvider("pdp11", {
      //allows for both upper and lower case instructions
      ignoreCase: true,
      //uses regex to differeniate between different syntax
      tokenizer: {
        root: [
          // Comments
          [/;.*$/, "comment"],

          // Labels (allow indentation)
          [/^\s*[a-zA-Z_]\w*:/, "type.identifier"],

          // Directives
          [/\.(word|byte|ascii|asciz|blkw|end)\b/i, "keyword.directive"],

          // Instructions
          [/\b(MOV|MOVB|ADD|SUB|CMP|CMPB|CLR|INC|DEC|TST|BR|BNE|BEQ|BPL|BMI|BCC|BCS|BIC|JSR|RTS|JMP|HALT)\b/i, "keyword"],

          // Registers
          [/\b(R[0-7]|sp|pc)\b/i, "variable.predefined"],

          // Immediate values
          [/#-?\d+/, "number"],

          // Indirect
          [/@/, "operator"],

          // Auto increment / decrement
          [/\((R[0-7]|SP|PC)\)\+?/i, "type"],
          [/-\((R[0-7]|SP|PC)\)/i, "type"],

          // Octal (PDP-11 default)
          [/\b[0-7]+\b/, "number.octal"],

          // Decimal
          [/\b\d+\b/, "number"],

          // Strings
          [/".*?"/, "string"],

          // Operators / punctuation
          [/[,]/, "delimiter"],
        ]
      }
    })

    //color customization
    monaco.editor.defineTheme("editor-main", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569CD6" }, //blue
        { token: "keyword.directive", foreground: "4EC9B0" }, //teal
        { token: "variable.predefined", foreground: "C586C0" }, //purple
        { token: "number", foreground: "DCDCAA" }, //yellow-ish
        { token: "number.octal", foreground: "B5CEA8" }, //light green
        { token: "operator", foreground: "FFFFFF" }, //white
        { token: "comment", foreground: "6A9955" }, //dark green
        { token: "string", foreground: "CE9178" }, //brown orange
        { token: "type.identifier", foreground: "4FC1FF" } //bright blue
      ],
      colors: {
        "editor.background": "#14161A",
        "editorLineNumber.foreground": "#8E8E93",
        "editorCursor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#181B20"
      }
    })
  }

  return (
    <div className="flex flex-1 h-full">
      {/* monacco editor w/ custom language */}
      <Editor
        height="100%"
        language="pdp11"
        defaultValue="Write PDP11 code here..."
        value={code}
        onChange={(value) => setCode(value || "")}
        beforeMount={handleEditorWillMount}
        theme="editor-main"
        options={{
          fontFamily: "monospace",
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          colorDecorators: false
        }}
      />
    </div>
  )
}