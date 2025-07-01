function Cell({ cell }) {
    return (
        <>
            <strong>{(cell.name ? cell.name : "") + (cell.points ? " (" + cell.points + " points)" : "") + (cell.weight ? " (" + cell.weight + ")" : "")}</strong>
            {(cell.description ? " " + cell.description : "")}
        </>
    )
}

function Row({ row, size, criteria_column }) {
    const cells = [...row.levels];
    cells.splice(criteria_column - 1, 0, { name: row.name, description: row.description, points: row.points, weight: row.weight })

    return (
        <tr className="border">
            {cells.map((cell, index) => (
                (index + 1 === criteria_column) ? (
                    <th key={index} className="border p-min-1 bg-primary">
                        <Cell cell={cell} />
                    </th>
                ) : (
                    <td key={index} className="border p-min-1">
                        <Cell cell={cell} />
                    </td>
                )
            ))}
            {Array.from({ length: size - cells.length }, (_, i) => (
                <td className="border min-p-1" key={i}>&nbsp;</td>
            ))}
        </tr>
    );
}

export default function Rubric({ data }) {
    return (
        <div className="flex flex-col gap-2 w-4/5 mx-auto mt-4 text-center">
            <h1 className="text-4xl font-bold">{data.title}</h1>
            <p>{data.description}</p>
            <h2 className="text-2xl font-semibold">Breakdown</h2>
            <table className="w-full table-fixed border border-collapse"> 
                {data.headers ? (
                    <thead className="bg-black text-white">
                        <tr>
                            {data.headers.titles.map((header, index) => (
                                <th key={index} className="p-1">
                                    {(header.name ? header.name : "")
                                        + (header.points ? " (" + header.points + " points)" : "")
                                        + (header.weight ? " (" + header.weight + ")" : "")
                                        + (header.description ? header.description : "")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                ) : (
                    <></>
                )}
                <tbody>
                    {data.criteria.map((row, index) => (
                        <Row key={index} row={row} size={data.columns} criteria_column={data.criteria_column} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}