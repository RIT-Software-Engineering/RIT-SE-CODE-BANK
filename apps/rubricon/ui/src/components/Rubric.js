// function Cell({ cell }) {

// }

function Row({ row, size }) {
    return (
        <tr className="border">
            <th className="border p-1 bg-primary">
                <strong>{row.name + (row.points ? " (" + row.points + " points)" : "")}</strong><br></br>
                {row.description}
            </th>
            {row.levels.map((cell, index) => (
                <td className="border p-1" key={index}>
                    <strong>{cell.name + (cell.points ? " (" + cell.points + " points)" : "")}</strong><br></br>
                    {cell.description}
                </td>
            ))}
            {Array.from({ length: size - row.levels.length }, (_, i) => (
                <td className="border p-1" key={i}>&nbsp;</td>
            ))}
        </tr>
    );
}

function Table({ rows }) {
    let maxCells = 0;
    rows.forEach(row => {
        if (row.levels.length > maxCells) {
            maxCells = row.levels.length;
        }
    });

    return (
        <table className="border border-collapse">
            <tbody>
                {rows.map((row, index) => (
                    <Row key={index} row={row} size={maxCells} />
                ))}
            </tbody>
        </table>
    );
}

export default function Rubric({ data }) {
    return (
        <div className="flex flex-col gap-2 w-4/5 mx-auto mt-4 text-center">
            <h1 className="text-4xl font-bold">{data.title}</h1>
            <p>{data.description}</p>
            <h2 className="text-2xl font-semibold">Breakdown</h2>
            <div>
                <Table rows={data.criteria} />
            </div>
        </div>
    )
}