
export default function Editor({ code, setCode }) {
  return (
    //temp placeholders for the numbers list
    <div className="flex flex-1 flex=row">
      <ol className="bg-main-secondary text-center w-10 p-3">
        <li>1</li>
        <li>2</li>
        <li>3</li>
      </ol>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write PDP-11 assembly here..."
        className="flex flex-1 bg-main-primary text-text-primary font-mono p-3 focus:outline-none resize-none"
      />

    </div>

    
  )
}
