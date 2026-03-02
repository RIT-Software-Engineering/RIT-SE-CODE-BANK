import Editor from "@monaco-editor/react"

export default function CodeEditor({ code, setCode }) {

  function handleEditorWillMount(monaco) {

    monaco.languages.register({ id: "pdp11" })

    monaco.languages.setMonarchTokensProvider("pdp11", {
      tokenizer: {
        root: [
          // Comments
          [/;.*$/, "comment"],

          // Labels (allow indentation)
          [/^\s*[a-zA-Z_]\w*:/, "type.identifier"],

          // Directives
          [/\.(word|byte|ascii|asciz|blkw|end)\b/i, "keyword.directive"],

          // Instructions
          [/\b(mov|movb|add|sub|cmp|cmpb|clr|inc|dec|tst|br|bne|beq|bpl|bmi|bcc|bcs|jsr|rts|jmp|halt)\b/i, "keyword"],

          // Registers
          [/\b(r[0-7]|sp|pc)\b/i, "variable.predefined"],

          // Immediate values
          [/#-?\d+/, "number"],

          // Indirect
          [/@/, "operator"],

          // Auto increment / decrement
          [/\((r[0-7]|sp|pc)\)\+?/i, "type"],
          [/-\((r[0-7]|sp|pc)\)/i, "type"],

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

    monaco.editor.defineTheme("editor-main", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569CD6" },
        { token: "keyword.directive", foreground: "4EC9B0" },
        { token: "variable.predefined", foreground: "C586C0" },
        { token: "number", foreground: "DCDCAA" },
        { token: "number.octal", foreground: "B5CEA8" },
        { token: "operator", foreground: "FFFFFF" },
        { token: "comment", foreground: "6A9955" },
        { token: "string", foreground: "CE9178" },
        { token: "type.identifier", foreground: "4FC1FF" }
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
          scrollBeyondLastLine: false
        }}
      />
    </div>
  )
}