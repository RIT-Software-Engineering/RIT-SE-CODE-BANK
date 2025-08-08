import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { KeyboardArrowDownOutlined } from "@mui/icons-material";
import EditButton from "@/components/common/buttons/EditButton";
import DeleteButton from "@/components/common/buttons/DeleteButton";
import { formatTime } from "@/utils/applicationUtils";

/**
 * A reusable component to display a list of job positions in a collapsible section.
 * @param {object} props
 * @param {string} props.title - The title of the section (e.g., "Pending Positions").
 * @param {Array} props.positions - The array of position objects to display.
 * @param {function} props.onEdit - The function to call when an edit button is clicked.
 * @param {function} props.onDelete - The function to call when a delete button is clicked.
 * @param {string} props.emptyMessage - The message to display if the positions array is empty.
 */
export default function PositionSection({ title, positions, onEdit, onDelete, emptyMessage }) {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<KeyboardArrowDownOutlined />}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Typography sx={{ fontWeight: "bold" }}>
          {title} ({positions.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {positions.length > 0 ? (
          <ul className="space-y-4">
            {positions.map((position) => (
              <li
                key={position.id}
                className="border-b border-gray-200 pb-4 last:border-b-0 flex flex-row justify-between"
              >
                {/* displays the position details */}
                <div>
                  <div className="font-semibold text-gray-800">{position.id}</div>
                  <div className="text-md text-gray-600">
                    {position.course?.courseCode} - {position.course?.name || "Unnamed Course"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {position.location} ({position.locationType}) – {position.jobPositionStatus}
                  </div>
                  <div>
                    {position.jobSchedules?.map((day) => (
                      <span key={day.id} className="mr-3">
                        {day.dayOfWeek} <br />
                        {formatTime(day.startTime)} - {formatTime(day.endTime)}
                        <br />
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <EditButton handleOpenModal={() => onEdit(position)} />
                  <DeleteButton handleDelete={() => onDelete(position)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">
            {emptyMessage}
          </p>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

