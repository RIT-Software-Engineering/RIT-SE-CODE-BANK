import Editor from "@monaco-editor/react"

export default function CodeEditor({ code, setCode }) {

  function handleEditorWillMount(monaco) {

    monaco.languages.register({ id: "pdp11" })

    monaco.languages.setMonarchTokensProvider("pdp11", {
      tokenizer: {
        root: [

          [/\b(mov|add|sub|cmp|clr|inc|dec|br|bne|beq|jsr|rts|halt)\b/i, "keyword"],

          [/\b(r[0-7]|sp|pc)\b/i, "type"],

          [/#?\b\d+\b/, "number"],

          [/;.*$/, "comment"],

          [/^[a-zA-Z_]\w*:/, "type.identifier"]
        ]
      }
    })

    monaco.editor.defineTheme("editor-main", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569CD6" },
        { token: "type", foreground: "C586C0" },
        { token: "number", foreground: "DCDCAA" },
        { token: "comment", foreground: "6A9955" },
        { token: "type.identifier", foreground: "4EC9B0" }
      ],
      colors: {
        "editor.background": "#14161A",      // dark slate
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