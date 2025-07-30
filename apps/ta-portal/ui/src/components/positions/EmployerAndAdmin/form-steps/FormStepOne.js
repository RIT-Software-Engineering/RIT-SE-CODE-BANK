import { Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { getAllCourses, getAllPositions } from "@/services/db-apis"; // Assuming these API functions exist
import CreateCourseModal from "../CreateCourseModal"; // Import the modal component

// =============================================================================
// Reusable Autocomplete Component
// =============================================================================
const CourseAutocomplete = ({
  value,
  onChange,
  error,
  availableCourses,
}) => (
  <div className="relative">
    <label
      htmlFor="courseCode"
      className="block text-sm font-medium text-gray-700"
    >
      Course Code
    </label>
    <input
      id="courseCode"
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      list="course-list"
      placeholder="e.g., SWEN-261"
      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
        error ? "border-red-500" : "border-gray-300"
      }`}
      autoComplete="off"
    />
    <datalist id="course-list">
      {availableCourses.slice(0, 15).map((course) => (
        <option key={course.courseCode} value={course.courseCode}>
          {course.name}
        </option>
      ))}
    </datalist>
  </div>
);

export default function FormStepOne({
  register,
  control,
  errors,
  getValues,
  setValue,
  isEditMode,
}) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courses, positions] = await Promise.all([
          getAllCourses(),
          getAllPositions() // Assuming this function fetches all job positions
        ]);
        
        setAvailableCourses(courses);
        setAvailablePositions(positions);
      } catch (error) {
        console.error("Failed to fetch initial form data:", error);
      }
    };

    if (!isEditMode) { // Only fetch positions if we are in "create" mode
        fetchInitialData();
    } else {
        // In edit mode, we only need the courses for the autocomplete
        const fetchCourses = async () => {
            try {
                const courses = await getAllCourses();
                setAvailableCourses(courses);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            }
        };
        fetchCourses();
    }
  }, [isEditMode]);

  const handleCourseCreated = (newCourse) => {
    // Add the new course to our list so it's available for autocomplete
    setAvailableCourses((prev) => [...prev, newCourse]);
    // Set the form value to the new course code, which autofills the input
    setValue("courseCode", newCourse.courseCode, { shouldValidate: true });
    // Note: The modal is closed by the `onClose` call inside its own `handleCreate` function
  };



  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Course Code Autocomplete */}
        <div className="md:col-span-1">
          <Controller
            name="courseCode"
            control={control}
            rules={{
              required: "A course code is required.",
              pattern: {
                value: /^[A-Za-z]+-\d+$/,
                message: "Course code must be in the format DEPARTMENT-COURSE_NUMBER (e.g., SWEN-261)."
              },
              validate: (value) =>
                availableCourses.some(
                  (course) => course.courseCode === value
                ) || "NOT_FOUND",
            }}
            render={({ field, fieldState }) => (
              <CourseAutocomplete
                {...field}
                error={fieldState.error}
                availableCourses={availableCourses}
              />
            )}
          />
          {errors.courseCode && (
            <div className="text-red-500 text-xs mt-1">
              {errors.courseCode.message === "NOT_FOUND" ? (
                <span>
                  Course not found.{" "}
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="text-blue-600 underline font-semibold"
                  >
                    Create a new course?
                  </button>
                </span>
              ) : (
                errors.courseCode.message
              )}
            </div>
          )}
        </div>

        {/* Other fields... */}
        <div>
          <label
            htmlFor="semesterCode"
            className="block text-sm font-medium text-gray-700"
          >
            Semester Code
          </label>
          <input
            type="number"
            id="semesterCode"
            {...register("semesterCode", {
              required: "Semester Code is required.",
            })}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
              errors.semesterCode ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.semesterCode && (
            <p className="text-red-500 text-xs mt-1">
              {errors.semesterCode.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="sectionNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Section Number
          </label>
          <input
            type="number"
            id="sectionNumber"
            {...register("sectionNumber", {
              required: "Section Number is required.",
              // Check to ensure the position is not already taken
              validate: (value) => {
                // Only run this validation in "create" mode
                if (isEditMode) return true;

                const { courseCode, semesterCode } = getValues();
                if (!value || !courseCode || !semesterCode) return true;

                const newPositionId = `${semesterCode}-${courseCode}-${value}`;
                const alreadyExists = availablePositions.some(pos => pos.id === newPositionId);
                
                return !alreadyExists || "This job position already exists.";
              }
            })}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
              errors.sectionNumber ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.sectionNumber && (
            <p className="text-red-500 text-xs mt-1">
              {errors.sectionNumber.message}
            </p>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateCourseModal
          initialCode={getValues("courseCode")}
          onClose={() => setCreateModalOpen(false)}
          onCourseCreated={handleCourseCreated}
        />
      )}
    </div>
  );
}
