import React from "react"
import { List } from "react-window"

const COLUMNS = Array.from({ length: 16 }, (_, i) =>
  i.toString(16).toUpperCase()
)

function MemoryRow({ index, style, memory }) {
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
        const value = memory[address] ?? 0
        return (
          <div key={colIndex} className="flex-1 text-center border border-border-secondary hover:bg-main-primary w-full">
            {value.toString(16).toUpperCase().padStart(4, "0")}
          </div>
        )})}
    </div>
  )
}

function MemoryPanel({ memory = [] }) {
  const rowCount = Math.ceil(memory.length / 16)

  return (
    <div className="h-full w-full bg-main-secondary flex flex-col">
      
      <div className="flex shrink-0 w-full pr-5 pl-5">
        <div className="w-16 border border-border-secondary bg-main-secondary"></div>
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