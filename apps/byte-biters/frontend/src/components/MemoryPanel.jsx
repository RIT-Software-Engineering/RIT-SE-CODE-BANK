import React from "react"
import { List } from "react-window"

const COLUMNS = Array.from({ length: 16 }, (_, i) =>
  i.toString(16).toUpperCase()
)

function MemoryRow({ index, style, memory }) {
  const baseAddress = index * 16

  return (
    <div style={style} className="flex">
      {/* Address column */}
      <div className="w-16 p-2 border text-center border-border-secondary bg-main-secondary">
        {baseAddress.toString(16).toUpperCase().padStart(4, "0")}
      </div>

      {/*Memory*/}
      {COLUMNS.map((_, colIndex) => {
        const address = baseAddress + colIndex
        const value = memory[address] ?? 0
        return (
          <div key={colIndex} className="w-16 p-2 text-center border border-border-secondary hover:bg-main-primary">
            {value.toString(16).toUpperCase().padStart(4, "0")}
          </div>
        )})}
    </div>
  )
}

function MemoryPanel({ memory = [] }) {
  const rowCount = Math.ceil(memory.length / 16) 

  return (
    <div className="h-full bg-main-secondary items-center flex flex-col">
      
      <List
        rowComponent={MemoryRow}
        rowCount={rowCount}
        rowHeight={32}
        rowProps={{ memory }}
        style={{ height: "100%" }}
      >
      <div className="flex sticky top-0 bg-main-secondary border-border-secondary">
        <div className="w-16 flex"></div>
        {COLUMNS.map((col) => (
          <div key={col} className="w-16 text-center border border-border-secondary">
             +{col} 
          </div>
        ))}
      </div>

      </List>
    </div>
  )
}

export default React.memo(MemoryPanel)