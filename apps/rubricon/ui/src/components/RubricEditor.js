"use client";

import React from "react";

// Constants
const BLANK_CELL = { name: "", description: "", points: null, weight: null };

// Factory function for a new row, includes the empty levels array
const createBlankRow = () => ({
    ...BLANK_CELL,
    levels: [],
});

// Ensures an array has at least `length` items, padding with `filler()` if necessary
function ensureArrayLength(arr = [], length, filler) {
    const result = [...arr];
    while (result.length < length) result.push(filler());
    return result;
}

// Component to render/edit a single rubric cell
function Cell({ cell, onChange }) {
    const fields = [
        { type: "text", key: "name", placeholder: "Name" },
        { type: "number", key: "points", placeholder: "Points" },
        { type: "number", key: "weight", placeholder: "Weight" },
    ];

    return (
        <div className="flex flex-col gap-1 p-4">
            {fields.map(({ key, ...props }) => (
                <input
                    key={key}
                    {...props}
                    value={cell[key] ?? ""}
                    onChange={(e) =>
                        onChange({
                            ...cell,
                            [key]: props.type === "number" ? parseFloat(e.target.value) || null : e.target.value,
                        })
                    }
                    className="border rounded-sm p-1"
                />
            ))}
            <textarea
                placeholder="Description"
                value={cell.description ?? ""}
                onChange={(e) => onChange({ ...cell, description: e.target.value })}
                className="border rounded-sm p-1"
            />
        </div>
    );
}

// A single row in the rubric table
function Row({ data, setData, row, rowIndex, size, criteria_column }) {
    const ensureLevelsLength = (levels) => {
        const lengthNeeded = size - 1;
        if (!levels) levels = [];
        if (levels.length < lengthNeeded) {
            return [
                ...levels,
                ...Array(lengthNeeded - levels.length).fill({ ...BLANK_CELL }),
            ].map((lvl, i) => ({ ...lvl, index: i }));
        } else if (levels.length > lengthNeeded) {
            return levels.slice(0, lengthNeeded).map((lvl, i) => ({ ...lvl, index: i }));
        }
        return levels.map((lvl, i) => ({ ...lvl, index: i }));
    };

    const levels = ensureLevelsLength(row.levels);

    // Remove this row by rowIndex
    const handleRemoveRow = () => {
        const updatedCriteria = data.criteria
            .filter((_, i) => i !== rowIndex)
            .map((criterion, i) => ({
                ...criterion,
                index: i,
                levels: (criterion.levels ?? []).map((level, j) => ({ ...level, index: j })),
            }));

        setData({
            ...data,
            criteria: updatedCriteria,
            rows: updatedCriteria.length,
        });
    };

    const handleCellChange = (colIndex, updatedCell) => {
        const isCriteriaCol = colIndex === criteria_column - 1;

        const updatedCriteria = data.criteria.map((r, i) => {
            if (i !== rowIndex) return r;

            if (isCriteriaCol) {
                return {
                    ...updatedCell,
                    index: rowIndex,
                    levels: levels,
                };
            } else {
                const levelIndex = colIndex > criteria_column - 1 ? colIndex - 1 : colIndex;
                const newLevels = levels.map((lvl, j) =>
                    j === levelIndex ? { ...updatedCell, index: levelIndex } : lvl
                );

                return {
                    ...r,
                    levels: newLevels,
                    index: rowIndex,
                };
            }
        });

        setData({ ...data, criteria: updatedCriteria });
    };

    return (
        <>
            {Array.from({ length: size }).map((_, colIndex) => {
                const isCriteriaCol = colIndex === criteria_column - 1;

                if (isCriteriaCol) {
                    const cell = row;

                    return (
                        <td
                            key={colIndex}
                            className="border p-1 align-top bg-primary relative group"
                        >
                            <div className="absolute top-0 right-0 p-1">
                                <button
                                    onClick={handleRemoveRow}
                                    className="text-red-400 hover:text-red-600 text-xs bg-white rounded-sm px-1 opacity-0 group-hover:opacity-100 transition"
                                    title="Remove row"
                                >
                                    🗑
                                </button>
                            </div>
                            <Cell
                                cell={cell}
                                onChange={(newCell) => handleCellChange(colIndex, newCell)}
                            />
                        </td>
                    );
                } else {
                    const levelIndex = colIndex > criteria_column - 1 ? colIndex - 1 : colIndex;
                    const cell = levels[levelIndex] ?? { ...BLANK_CELL, index: levelIndex };

                    return (
                        <td key={colIndex} className="border p-1 align-top">
                            <Cell
                                cell={cell}
                                onChange={(updatedCell) => handleCellChange(colIndex, updatedCell)}
                            />
                        </td>
                    );
                }
            })}
        </>
    );
}



export default function RubricEditor({ data, setData }) {
    const {
        title,
        description,
        rows,
        columns,
        criteria_column,
        headers,
        criteria,
    } = data;

    const setField = (key, value) => {
        setData({ ...data, [key]: value });
    };

    // Ensure indexes for headers titles are sequential 0..n-1
    function updateHeaderIndexes(titles) {
        return titles.map((t, i) => ({ ...t, index: i }));
    }

    // Ensure indexes for criteria and their levels sequentially set
    function updateCriteriaIndexes(criteriaList) {
        return criteriaList.map((criterion, i) => ({
            ...criterion,
            index: i,
            levels: (criterion.levels ?? []).map((level, j) => ({
                ...level,
                index: j,
            })),
        }));
    }

    const handleAddRow = () => {
        // Add a blank row with proper index
        const newRow = { ...createBlankRow(), index: criteria.length };
        const updatedCriteria = [...criteria, newRow];

        setData({
            ...data,
            criteria: updateCriteriaIndexes(updatedCriteria),
            rows: updatedCriteria.length,
        });
    };

    const handleAddColumn = () => {
        const newColumnIndex = columns; // zero-based index for new column

        // Update headers by adding a blank header cell with proper index
        const updatedHeaders = ensureArrayLength(headers?.titles ?? [], columns + 1, () => ({ ...BLANK_CELL }));
        updatedHeaders[newColumnIndex] = { ...BLANK_CELL, index: newColumnIndex };

        // Update criteria rows: each level array must grow by one for the new column (if needed)
        // Note: You may want to add logic here if criteria.levels length < columns - 1
        // but usually that is handled in Row component with ensureArrayLength
        // so no need to forcibly add levels here unless your logic requires it

        setData({
            ...data,
            columns: newColumnIndex + 1,
            headers: { ...headers, titles: updateHeaderIndexes(updatedHeaders) },
        });
    };

    const removeColumnAt = (colIndex) => {
        if (columns <= 1) return;

        // Remove header at colIndex and reindex remaining headers
        const updatedHeaders = (headers?.titles ?? []).filter((_, i) => i !== colIndex);
        const reindexedHeaders = updateHeaderIndexes(updatedHeaders);

        // Remove column data from criteria levels or criteria themselves if criteria column removed
        const updatedCriteria = criteria.map((row) => {
            const isCriteriaCol = colIndex === criteria_column - 1;
            if (isCriteriaCol) {
                // Reset criteria column fields if criteria column removed
                return { ...row, ...BLANK_CELL };
            }
            // Adjust level index accounting for criteria column position
            const levelIndex = colIndex > criteria_column - 1 ? colIndex - 1 : colIndex;
            const newLevels = (row.levels ?? []).filter((_, i) => i !== levelIndex);
            return { ...row, levels: newLevels };
        });

        const newCriteriaCol =
            colIndex === criteria_column - 1
                ? 1
                : criteria_column - 1 > colIndex
                    ? criteria_column - 1
                    : criteria_column;

        setData({
            ...data,
            columns: columns - 1,
            headers: { ...headers, titles: reindexedHeaders },
            criteria: updateCriteriaIndexes(updatedCriteria),
            criteria_column: newCriteriaCol,
        });
    };

    return (
        <div className="flex flex-col items-stretch gap-2 w-4/5">

            <input
                type="text"
                value={title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Rubric Title"
                className="text-4xl text-center p-2 border rounded-md"
            />
            <textarea
                value={description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Rubric Description"
                className="text-md p-2 border rounded-md"
            />
            <h3 className="text-2xl text-center">Breakdown</h3>
            <h4 className="text-lg">Dimensions</h4>

            <div className="grid grid-cols-3 gap-4 pb-2">
                <div>
                    <label>Rows:</label><br></br>
                    <input value={rows} disabled readOnly className="w-full p-2 border rounded-md bg-light-gray" />
                </div>
                <div>
                    <label>Columns:</label><br></br>
                    <input value={columns} disabled readOnly className="w-full p-2 border rounded-md bg-light-gray" />
                </div>
                <div>
                    <label>Criteria Column:</label><br></br>
                    <input
                        type="number"
                        value={criteria_column}
                        min={1}
                        max={columns}
                        onChange={(e) => setField("criteria_column", parseInt(e.target.value, 10) || 1)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full p-2 border rounded-md"
                    />
                </div>
            </div>

            <div className="flex flex-row gap-2 items-stretch">
                <table className="w-full table-fixed border border-collapse grow">
                    <thead className="bg-black text-white">
                        <tr>
                            {Array.from({ length: columns }).map((_, colIndex) => {
                                const titleCell = headers?.titles?.[colIndex] ?? { ...BLANK_CELL, index: colIndex };

                                return (
                                    <th key={colIndex} className="p-1 align-top relative group">
                                        {colIndex !== criteria_column - 1 && (
                                            <div className="absolute top-0 right-0 p-1">
                                                <button
                                                    onClick={() => removeColumnAt(colIndex)}
                                                    className="text-red-400 hover:text-red-600 text-xs bg-white rounded-sm px-1 opacity-0 group-hover:opacity-100 transition"
                                                    title="Remove column"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        )}
                                        <Cell
                                            cell={titleCell}
                                            onChange={(updated) => {
                                                // Ensure titles length and indexes updated on change
                                                const updatedTitles = ensureArrayLength(headers?.titles ?? [], colIndex + 1, () => ({ ...BLANK_CELL }));
                                                updatedTitles[colIndex] = { ...updated, index: colIndex };
                                                setField("headers", { ...headers, titles: updateHeaderIndexes(updatedTitles) });
                                            }}
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {criteria.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border">
                                <Row
                                    data={data}
                                    setData={(updatedData) => {
                                        // Intercept Row's setData to update indexes properly
                                        const updatedCriteria = updatedData.criteria.map((r, i) => ({
                                            ...r,
                                            index: i,
                                            levels: (r.levels ?? []).map((lvl, j) => ({ ...lvl, index: j })),
                                        }));
                                        setData({ ...updatedData, criteria: updatedCriteria });
                                    }}
                                    row={row}
                                    rowIndex={rowIndex}
                                    size={columns}
                                    criteria_column={criteria_column}
                                />
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button onClick={handleAddColumn} className="text-2xl bg-light-gray p-1 border rounded-md w-[24px]">+</button>
            </div>

            <div className="flex flex-row gap-2">
                <button
                    onClick={handleAddRow}
                    className="text-2xl bg-light-gray p-1 border rounded-md grow h-[24px] flex items-center justify-center"
                >
                    +
                </button>
                <div className="w-[24px]"></div>
            </div>
        </div>
    );
}

