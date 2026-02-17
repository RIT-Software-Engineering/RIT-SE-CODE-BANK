
export default function Editor({ code, setCode }) {
  return (
    <div className="h-full flex flex-col min-h-screen w-4/5">

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write PDP-11 assembly here..."
        className="flex-1 bg-main-primary text-text-primary font-mono p-3 rounded resize-none focus:outline-none"
      />

    </div>
  )
}
