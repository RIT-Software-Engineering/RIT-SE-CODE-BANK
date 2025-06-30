function Criterion({ criterion, size }) {
    return (
        <tr>
            <th>
                <strong>{criterion.name + " (" + criterion.points + " points)"}</strong><br></br>
                {criterion.description}
            </th>
            {criterion.levels.map((level, index) => (
                <td key={index}>
                    <strong>{level.name + " (" + level.points + " points)"}</strong><br></br>
                    {level.description}
                </td>
            ))}
            {Array.from({ length: size - criterion.levels.length }, (_, i) => (
                <td key={i}>&nbsp;</td>
            ))}
        </tr>
    );
}

function CriteriaTable({ criteria }) {
    let maxLevels = 0;
    criteria.forEach(criterion => {
        if (criterion.levels.length > maxLevels) {
            maxLevels = criterion.levels.length;
        }
    });

    return (
        <table className="criteria-list" style={{ borderCollapse: 'collapse' }}>
            <tbody>
                {criteria.map((criterion, index) => (
                    <Criterion key={index} criterion={criterion} size={maxLevels} />
                ))}
            </tbody>
        </table>
    );
}

export default function Rubric({ data }) {
    return (
        <>
            <h1>{data.title}</h1>
            <p>{data.description}</p>
            <h2>Breakdown</h2>
            <div className="table-container">
                <CriteriaTable criteria={data.criteria} />
            </div>
        </>
    )
}