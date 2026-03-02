export default function MemoryPanel({ memory }) {
  //stores the table headers for the columns
  const columns = Array.from({ length: 16 }, (_, i) =>
    i.toString(16).toUpperCase()
  )

  //stores the table headers for the rows
  const rows = Array.from({ length: memory.length / 16 }, (_, i) =>
    (i * 16).toString(16).toUpperCase().padStart(3, "0")
  )

  return (
    <div className="bg-main-secondary flex justify-center px-4 h-full overflow-auto pb-4">
      <table className="w-full text-center border-separate border-spacing-0">
        <thead >
          <tr>
            <th className="p-2 border border-border-secondary bg-main-secondary sticky top-0 z-10"></th>
            {columns.map((col) => (
              <th key={col} className="p-2 border border-border-secondary bg-main-secondary sticky top-0 z-10">
                +{col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((rowLabel, rowIndex) => (
            <tr key={rowLabel}>
              <td className="p-2 border border-border-secondary">
                {rowLabel}
              </td>

              {columns.map((_, colIndex) => {
                const address = rowIndex * 16 + colIndex
                const value = memory[address]

                return (
                  <td key={colIndex} className="p-2 border border-border-secondary hover:bg-main-primary">
                    {value
                      .toString(16)
                      .toUpperCase()
                      .padStart(3, "0")}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}