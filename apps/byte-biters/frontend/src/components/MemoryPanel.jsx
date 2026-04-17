import React from "react"
import { List } from "react-window"

//creates the 16 hex labels for the memory table
const COLUMNS = Array.from({ length: 16 }, (_, i) =>
  i.toString(16).toUpperCase()
)

//component for a single memory row, accounts for the address column and the actual memory
function MemoryRow({ index, style, memory }) {
  //16 memory addresses per row
  const baseAddress = index * 16

  return (
    <div style={style} className="flex w-full ">
      {/* Address column */}
      <div className="w-16 border text-center border-border-secondary bg-main-secondary">
        {baseAddress.toString(16).toUpperCase().padStart(4, "0")}
      </div>

      {/*Memory*/}
      {COLUMNS.map((_, colIndex) => {
        const address = baseAddress + colIndex
        //sets the value to 0 by default
        const value = memory[address] ?? 0
        return (
          <div key={colIndex} className="flex-1 text-center border border-border-secondary hover:bg-main-primary w-full">
            {value.toString(16).toUpperCase().padStart(4, "0")}
          </div>
        )})}
    </div>
  )
}

//the full comprehensive memory panel
function MemoryPanel({ memory = [] }) {
  //calculates the number of rows needed
  const rowCount = Math.ceil(memory.length / 16)

  return (
    <div className="h-full w-full bg-main-secondary flex flex-col">
      {/* offsets header to account for address column */}
      <div className="flex shrink-0 w-full pr-5 pl-5">
        <div className="w-16 border border-border-secondary bg-main-secondary"></div>
        {/* labels columns from +0 to +F */}
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="flex-1 text-center border border-border-secondary w-full"
          >
            +{col}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 w-full overflow-y-scroll pl-5">
        {/* uses react window due to the lag that the memory panel normally generates */}
        <List
          rowComponent={MemoryRow}
          rowCount={rowCount}
          rowHeight={32}
          rowProps={{ memory }}
          height={500} 
          width="100%"
        />
      </div>
    </div>
  )
}

export default React.memo(MemoryPanel)