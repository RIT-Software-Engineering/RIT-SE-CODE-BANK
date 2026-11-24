"use client";

/**
 * InquiryResponseField
 * 
 * A reusable component for displaying and responding to assessment
 * inquiries.
 * 
 * Supports Free Response, Rating, and Rubric inquiry types.
 * Can operate in editable or read-only mode depending on its props.
 * 
 * Receives the current response value and reports changes through 
 * onChange. Response storage and submission are handled by the parent.
 */
import { useId } from "react";
import {
    InquiryType,
    type Inquiry,
} from "../types/assessment";

type InquiryResponseFieldProps = {
    inquiry: Inquiry;
    value: string;
    onChange?: (value: string) => void;
    editable?: boolean;
};

function parseRubricSelections(
    value: string,
    rowCount: number,
    optionCount: number
): number[] {
    try {
        const parsed: unknown = JSON.parse(value);

        if (!Array.isArray(parsed)) {
            return Array(rowCount).fill(-1);
        }

        return Array.from({ length: rowCount }, (_, index) => {
            const selected = parsed[index];

            return (
                typeof selected === "number" &&
                Number.isInteger(selected) &&
                selected >= 0 &&
                selected < optionCount
            )
                ? selected
                : -1;
        });
    } catch {
        return Array(rowCount).fill(-1);
    }
}

export default function InquiryResponseField({
    inquiry,
    value,
    onChange,
    editable = false,
}: InquiryResponseFieldProps) {
    const id = useId();
    const canEdit = editable && Boolean(onChange);

    switch (inquiry.type) {
        case InquiryType.FREE_RESPONSE:
            return (
                <div className="space-y-2">
                    <label className="block font-semibold">
                        {inquiry.question}
                    </label>

                    <textarea
                        className="w-full border rounded p-2"
                        value={value}
                        onChange={(event) =>
                            onChange?.(event.target.value)
                        }
                        rows={4}
                        disabled={!canEdit}
                    />
                </div>
            );

        case InquiryType.RATING: {
            const labels = inquiry.labels.split(";");

            return (
                <div className="space-y-2">
                    <label className="block font-semibold">
                        {inquiry.question}
                    </label>

                    <div className="flex items-center space-x-2">
                        {labels[0] && (
                            <span>{labels[0]}</span>
                        )}

                        {[...Array(inquiry.scale)].map((_, index) => (
                            <label
                                key={index}
                                className="flex flex-col items-center"
                            >
                                <input
                                    type="radio"
                                    name={`${id}-${inquiry.id}`}
                                    value={index + 1}
                                    checked={value === `${index + 1}`}
                                    onChange={() =>
                                        onChange?.(`${index + 1}`)
                                    }
                                    disabled={!canEdit}
                                />

                                <span>{index + 1}</span>
                            </label>
                        ))}

                        {labels[1] && (
                            <span>{labels[1]}</span>
                        )}
                    </div>
                </div>
            );
        }

        case InquiryType.RUBRIC: {
            const options = inquiry.options.split(";");

            const selectedValues = parseRubricSelections(
                value,
                inquiry.rows.length,
                options.length
            );

            const handleRubricChange = (
                rowIndex: number,
                columnIndex: number
            ) => {
                const updatedValues = [...selectedValues];
                updatedValues[rowIndex] = columnIndex;

                onChange?.(JSON.stringify(updatedValues));
            };

            return (
                <div className="space-y-2">
                    <label className="block font-semibold">
                        {inquiry.question}
                    </label>

                    <table className="w-full border">
                        <thead>
                            <tr>
                                <th></th>

                                {options.map((option, columnIndex) => (
                                    <th
                                        key={columnIndex}
                                        className="px-2 py-1 border"
                                    >
                                        {option}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {inquiry.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="border px-2 py-1">
                                        {row.label}
                                    </td>

                                    {options.map((_, columnIndex) => (
                                        <td
                                            key={columnIndex}
                                            className="border text-center"
                                        >
                                            <input
                                                type="radio"
                                                name={`${id}-${inquiry.id}-row-${rowIndex}`}
                                                checked={
                                                    selectedValues[rowIndex] ===
                                                    columnIndex
                                                }
                                                onChange={() =>
                                                    handleRubricChange(
                                                        rowIndex,
                                                        columnIndex
                                                    )
                                                }
                                                disabled={!canEdit}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        default:
            return null;
    }
}
