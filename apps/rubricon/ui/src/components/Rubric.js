import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

export function RubricEditor({ data, onSave }) {
    const navigate = useNavigate();

    const [title, setTitle] = useState(data.title);
    const [description, setDescription] = useState(data.description);
    const [criteria, setCriteria] = useState(data.criteria);

    const handleSave = () => {
        onSave({ title, description, criteria });
    };

    const handleCancel = () => {
        navigate(-1);
    };

    // Trying to figure out how to drag and drop criteria
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData("text/plain", index);
    };

    const handleCriterionDrop = (e, targetIndex) => {
        e.preventDefault();
        const sourceIndex = e.dataTransfer.getData("text/plain");
        if (sourceIndex !== targetIndex) {
            const newCriteria = [...criteria];
            const [draggedItem] = newCriteria.splice(sourceIndex, 1);
            newCriteria.splice(targetIndex, 0, draggedItem);
            setCriteria(newCriteria);
        }
    };

    const handleLevelDrop = (e, criterionIndex, targetIndex) => {
        e.preventDefault();
        const sourceIndex = e.dataTransfer.getData("text/plain");
        if (sourceIndex !== targetIndex) {
            const newCriteria = [...criteria];
            const [draggedItem] = newCriteria[criterionIndex].levels.splice(sourceIndex, 1);
            newCriteria[criterionIndex].levels.splice(targetIndex, 0, draggedItem);
            setCriteria(newCriteria);
        }
    };

    return (
        <div className="rubric-editor">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Rubric Title"
                style={{ fontSize: '24pt' }}
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rubric Description"
                style={{ height: '100px', fontSize: '16pt' }}
            />
            <h3>Breakdown</h3>
            <div className="side-by-side">
                <CriteriaTable criteria={criteria} />
                <ul className="criteria" onDragOver={(e) => e.preventDefault()}>
                    {criteria.map((criterion, index) => (
                        <li
                            key={index}
                            criterion={criterion}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDrop={(e) => handleCriterionDrop(e, index)}
                            className="criterion"
                        >
                            <div className="criterion-header">
                                <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => {
                                        const newCriteria = [...criteria];
                                        newCriteria[index].name = e.target.value;
                                        setCriteria(newCriteria);
                                    }}
                                    placeholder="Criterion Name"
                                    style={{ flexGrow: 1 }}
                                />
                                <textarea
                                    value={criterion.description}
                                    onChange={(e) => {
                                        const newCriteria = [...criteria];
                                        newCriteria[index].description = e.target.value;
                                        setCriteria(newCriteria);
                                    }}
                                    placeholder="Rubric Description"
                                    style={{ flexGrow: 5 }}
                                />
                                <input
                                    type="number"
                                    value={criterion.points}
                                    onChange={(e) => {
                                        const newCriteria = [...criteria];
                                        newCriteria[index].points = parseInt(e.target.value, 10);
                                        setCriteria(newCriteria);
                                    }}
                                    placeholder="Points"
                                    style={{ fieldSizing: 'content', minWidth: "40px" }}
                                />
                                <button onClick={() => {
                                    const newCriteria = [...criteria];
                                    newCriteria.splice(index, 1);
                                    setCriteria(newCriteria);
                                }}>
                                    Remove Criterion
                                </button>
                            </div>
                            <ul className="levels" onDragOver={(e) => e.preventDefault()}>
                                {criterion.levels.map((level, levelIndex) => (
                                    <li
                                        key={levelIndex}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, levelIndex)}
                                        onDrop={(e) => handleLevelDrop(e, index, levelIndex)}
                                        className="level"
                                    >
                                        <input
                                            type="text"
                                            value={level.name}
                                            onChange={(e) => {
                                                const newCriteria = [...criteria];
                                                newCriteria[index].levels[levelIndex].name = e.target.value;
                                                setCriteria(newCriteria);
                                            }}
                                            placeholder="Level Name"
                                            style={{ flexGrow: 1 }}
                                        />
                                        <textarea
                                            value={level.description}
                                            onChange={(e) => {
                                                const newCriteria = [...criteria];
                                                newCriteria[index].levels[levelIndex].description = e.target.value;
                                                setCriteria(newCriteria);
                                            }}
                                            placeholder="Level Description"
                                            style={{ flexGrow: 5 }}
                                        />
                                        <input
                                            type="number"
                                            value={level.points}
                                            onChange={(e) => {
                                                const newCriteria = [...criteria];
                                                newCriteria[index].levels[levelIndex].points = parseInt(e.target.value, 10);
                                                setCriteria(newCriteria);
                                            }}
                                            placeholder="Points"
                                            style={{ fieldSizing: 'content', minWidth: "40px" }}
                                        />
                                        <button onClick={() => {
                                            const newCriteria = [...criteria];
                                            newCriteria[index].levels.splice(levelIndex, 1);
                                            setCriteria(newCriteria);
                                        }}>
                                            Remove Level
                                        </button>
                                    </li>
                                ))}
                                <button style={{ fontSize: '12pt' }} onClick={() => {
                                    const newCriteria = [...criteria];
                                    newCriteria[index].levels.push({ name: "", description: "", points: 0 });
                                    setCriteria(newCriteria);
                                }}>
                                    Add Level
                                </button>
                            </ul>
                        </li>
                    ))}
                    <button style={{ fontSize: '18pt' }} onClick={() => {
                        const newCriteria = [...criteria];
                        newCriteria.push({ name: "", description: "", points: 0, levels: [] });
                        setCriteria(newCriteria);
                    }}>
                        Add Criterion
                    </button>
                </ul>
            </div>
            {/* <button onClick={() => setEditorVisible(false)}>Close Editor</button> */}
            <button onClick={() => { handleSave(); }}>Save</button>
            <button onClick={() => { handleCancel(); }}>Cancel</button>
        </div>
    );
}

export default function Rubric({ data }) {
    // const [editorVisible, setEditorVisible] = useState(false);

    return (
        <div>
            <h1>{data.title}</h1>
            <p>{data.description}</p>
            <h2>Breakdown</h2>
            <div className="table-container">
                <CriteriaTable criteria={data.criteria} />
                {/* {editorVisible ? (
                    <>
                        <button onClick={() => setEditorVisible(false)}>Hide Editor</button>
                        <RubricEditor data={data} setData={setData} setEditorVisible={setEditorVisible} />
                    </>
                ) : (
                    <button onClick={() => setEditorVisible(true)}>Edit Rubric</button>
                )} */}
            </div>
        </div>
    )
}