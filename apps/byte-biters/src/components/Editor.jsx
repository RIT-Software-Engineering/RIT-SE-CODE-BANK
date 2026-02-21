
export default function Editor({ code, setCode }) {
  
  const lineNumbers = () => {
    //increment by 1 every time a new line is added to text area?
    //scroll with the text?
    //eventually add highlighting for specific line user is on
  };
  
  return (
    //temp placeholders for the line numbers
    <div className="flex flex-1 flex-row h-full">
      <ol className="bg-main-secondary text-center w-10 p-3">
        <li>1</li>
        <li>2</li>
        <li>3</li>
      </ol>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write PDP-11 assembly here..."
        className="flex flex-1 bg-main-primary text-text-primary font-mono p-3 focus:outline-none resize-none placeholder-text-muted"
      />

    </div>

    
  )
}
