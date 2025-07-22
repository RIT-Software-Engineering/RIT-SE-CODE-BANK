import { useForm } from "react-hook-form";
import { modifyPosition, createPosition } from "@/services/db-apis";
import MultiStepForm from "./MultiStepForm"; // Import the new form component
import { getAllCourses } from "@/services/db-apis";
import { formatDate, formatTime } from "@/utils/applicationUtils";
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
  maxCAs: 1,
  startDate: "",
  endDate: "",
  jobSchedules: [],
  courseCode: "",
  sectionNumber: "",
  semesterCode: "2241", // Default semester
  gradeRequirement: null,
  courseTakenRequirement: false,
};

export default function EditPositionModal({
  job,
  onClose,
  onSave,
  EmployerUID,
}) {
  const isEditMode = !!job.id; // Use !!job for a clear boolean
  console.log("Editing?", isEditMode, "Job data:", job);
  console.log("Faculty UID in modal:", EmployerUID);

  // 1. All form logic and state management stays in the container
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

  console.log("Form default values:", formMethods.getValues());

  // 2. The submission logic stays here as it deals with APIs and parent state
  const onSubmit = async (data) => {
    console.log("Submitting for Faculty: ", EmployerUID);
    console.log("Form data:", data);
    try {
      const payload = { ...data, EmployerUID };
      payload.maxCAs = parseInt(data.maxCAs, 10) || 0;
      console.log("Submitting job data:", payload);

      if (payload.startDate)
        payload.startDate = new Date(`${payload.startDate}T00:00:00.000Z`);
      if (payload.endDate)
        payload.endDate = new Date(`${payload.endDate}T00:00:00.000Z`);
      if (payload.jobSchedules) {
        payload.jobSchedules = payload.jobSchedules.map((schedule) => ({
          ...schedule,
          startTime: `1970-01-01T${schedule.startTime}:00.000Z`,
          endTime: `1970-01-01T${schedule.endTime}:00.000Z`,
        }));
      }

      let savedJob;
      if (isEditMode) {
        savedJob = await modifyPosition(job.id, payload);
      } else {
        const allCourses = await getAllCourses();
        const course = allCourses.find((c) => c.courseCode === data.courseCode);

        if (!course) {
          throw new Error(`Course with code ${data.courseCode} not found`);
        }

        payload.course = course;

        savedJob = await createPosition(payload, EmployerUID);
      }
      onSave(savedJob);
    } catch (error) {
      console.error("Failed to save position:", error);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Edit Job Position" : "Create New Job Position"}
        </h2>

        {/* 3. Render the form component, passing down all necessary data and functions */}
        <MultiStepForm
          onSubmit={onSubmit}
          onClose={onClose}
          isEditMode={isEditMode}
          job={job}
          formMethods={formMethods} // Pass the entire form instance
          EmployerUID={EmployerUID} // Pass the employer UID for API calls
        />
      </div>
    </div>
  );
}
