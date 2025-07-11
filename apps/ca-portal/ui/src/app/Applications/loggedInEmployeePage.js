import React from "react";
import CandidateApplicationCard from "@/components/jobs/CandidateApplicicationCard";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";

const loggedInEmployeePage = ({ loading, error, activeApplications }) => {
  // Handle loading and error states for a better user experience
  if (loading) {
    return <div>Loading applications...</div>;
  }
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Use Object.keys() to get an array of the position IDs that we can map over
  const positionIds = Object.keys(activeApplications || {});

  if (positionIds.length === 0) {
    return <div>No active applications found.</div>;
  }
  return (
    <div className="w-full justify-center flex flex-col items-center">
      <div id="section-container" className="w-4/5 p-2">
        {/* Map over the array of keys to render each position */}
        {positionIds.map((positionId) => {
          const position = activeApplications[positionId];
          return (
            // Use the unique position ID for the key prop 
            // Groups applications visually by position (course codes)
            <Accordion key={position.id} defaultExpanded>
              <AccordionSummary
                expandIcon={<KeyboardArrowDownOutlinedIcon />}
                aria-controls={`${position.id}-content`}
                id={`${position.id}-header`}
              >
                {/* Use the dynamic data from the position object */}
                <h2 className="text-3xl">
                  {position.courseCode} - Section {position.sectionNumber}
                </h2>
              </AccordionSummary>
              <AccordionDetails>
                {/* Map over the actual applications for this position */}
                {position.jobPositionApplicationHistory.length > 0 ? (
                  position.jobPositionApplicationHistory.map((app) => (
                    // Pass the specific application data to the card component
                    <CandidateApplicationCard
                      key={app.candidateUID}
                      application={app}
                    />
                  ))
                ) : (
                  <p>No candidates have applied for this position yet.</p>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </div>
    </div>
  );
};

export default loggedInEmployeePage;