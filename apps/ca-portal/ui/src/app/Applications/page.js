"use client";
import { useAuth } from "@/contexts/AuthContext";
import StudentApplicationCard from "@/components/StudentApplicicationCard";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

export default function Applications() {
  const { currentUser, setCurrentUser } = useAuth();

  const loggedInFacultyPage = () => {
    return (
      <div className="w-full justify-center flex flex-col items-center">
        <div id="section-container" className="w-4/5 p-2">
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownOutlinedIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <h2 className="text-3xl">Course Code</h2>
            </AccordionSummary>
            <AccordionDetails>
              <StudentApplicationCard />
              <StudentApplicationCard />
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center  p-4">
        <h1 className="text-4xl">Applications</h1>
        <p className="text-sm">See student applications</p>
      </div>
      <div className="flex flex-col items-center bg-gray-300 p-4 mb-10 ml-10 mr-10">
        {currentUser && currentUser.role === "EMPLOYER" ? (
          // Render content for EMPLOYER here
          <div className="w-full flex flex-col items-center justify-center">
            {loggedInFacultyPage()}
          </div>
        ) : (
          // Render content for non-EMPLOYER here
          <div>Please make sure you are logged in and an EMPLOYER</div>
        )}
      </div>
    </>
  );
}
