import { useForm } from "react-hook-form";
import { modifyPosition, createPosition } from "@/services/db-apis";
import MultiStepForm from "./MultiStepForm";
import { getAllCourses } from "@/services/db-apis";
import { formatTime } from "@/utils/applicationUtils";
import { convertDisplayTimeToInputValue } from "@/utils/applicationUtils";

// Helper functions can live outside the component
const formatDateToInputValue = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch (error) {
    return "";
  }
};

const newJobTemplate = {
  location: "",
  locationType: "INPERSON",
  maxTAs: 1,
  startDate: "",
  endDate: "",
  jobSchedules: [],
  courseCode: "",
  jobPositionStatus: 'PENDING_APPROVAL',
  sectionNumber: "",
  semesterCode: "2241", // Default semester
  gradeRequirement: null,
  courseTakenRequirement: false,
};

export default function EditPositionModal({
  job,
  onClose,
  onSave,
  EmployerUsername, // Note: This prop seems unused in the onSubmit logic
}) {
  // CORRECTED: Check for the existence of the 'job' object itself, not its 'id' property.
  const isEditMode = !!job; 

  const formMethods = useForm({
    defaultValues: isEditMode
      ? {
          ...job,
          startDate: formatDateToInputValue(job.startDate),
          endDate: formatDateToInputValue(job.endDate),
          jobSchedules: (job.jobSchedules || []).map((sch) => ({
            ...sch,
            startTime: convertDisplayTimeToInputValue(formatTime(sch.startTime)),
            endTime: convertDisplayTimeToInputValue(formatTime(sch.endTime)),
          })),
        }
      : newJobTemplate,
  });

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };

      if (payload.jobPositionStatus === 'REJECTED') {
        payload.jobPositionStatus = 'PENDING_APPROVAL';
      }
      
      payload.maxTAs = parseInt(data.maxTAs, 10) || 0;
      console.log("Submitting job data:", payload);

      if (payload.startDate)
        payload.startDate = new Date(`${payload.startDate}T00:00:00.000Z`);
      if (payload.endDate)
        payload.endDate = new Date(`${payload.endDate}T00:00:00.000Z`);
      if (Array.isArray(payload.jobSchedules)) {
        payload.jobSchedules = payload.jobSchedules.map((schedule) => ({
          ...schedule,
          startTime: `1970-01-01T${schedule.startTime}:00.000Z`,
          endTime: `1970-01-01T${schedule.endTime}:00.000Z`,
        }));
      } else {
        payload.jobSchedules = [];
      }

      // Pass the prepared data directly to the onSave handler from the parent.
      // The parent (AdminPositions.js) is now responsible for calling the correct API.
      onSave(payload);

    } catch (error) {
      console.error("Failed to prepare position data:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Edit Job Position" : "Create New Job Position"}
        </h2>

        <MultiStepForm
          onSubmit={onSubmit}
          onClose={onClose}
          isEditMode={isEditMode}
          job={job}
          formMethods={formMethods}
        />
      </div>
    </div>
  );
}