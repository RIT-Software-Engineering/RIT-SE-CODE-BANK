import { useForm, Controller } from "react-hook-form";
import DisplayField from "../ui/DisplayField";
import { modifyPosition } from "@/services/db-apis";
import ScheduleEditor from "./form-components/ScheduleEditor"; // Assuming this is the correct path

// =============================================================================
// HELPER FUNCTIONS FOR DATE & TIME FORMATTING
// =============================================================================

/**
 * Formats a date string for a date input's value.
 * Uses UTC methods to prevent timezone shifts from changing the date.
 * @param {string} dateString - The full ISO date string from the database.
 * @returns {string} The date formatted as "YYYY-MM-DD".
 */
const formatDateToInputValue = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch (error) {
    return "";
  }
};

const validateSchedules = (schedules) => {
  for (const schedule of schedules) {
    if (schedule.startTime && schedule.endTime && schedule.startTime > schedule.endTime) {
      // This message is what the user will see.
      return 'For each day, the start time must be before the end time.';
    }
  }
  return true; // All good!
};

export default function EditPositionModal({ job, onClose, onSave }) {
  // Set up react-hook-form with default values from the 'job' prop
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      location: job.location || "",
      locationType: job.locationType || "INPERSON",
      maxCAs: job.maxCAs || 0,
      startDate: formatDateToInputValue(job.startDate),
      endDate: formatDateToInputValue(job.endDate),
      // Format initial schedule times for the input fields
      jobSchedules: job.jobSchedules || [],
    },
  });
  console.log("Initial form values:", job);

  // This function is called by react-hook-form's handleSubmit
  const onSubmit = async (data) => {
    try {
      const payload = { ...job, ...data };
      payload.maxCAs = parseInt(payload.maxCAs, 10) || 0;

      // Convert dates to UTC Date objects
      if (payload.startDate) {
        payload.startDate = new Date(`${payload.startDate}T00:00:00.000Z`);
      }
      if (payload.endDate) {
        payload.endDate = new Date(`${payload.endDate}T00:00:00.000Z`);
      }

      // Convert schedule times from "HH:mm" to full UTC ISO strings
      if (payload.jobSchedules) {
        payload.jobSchedules = payload.jobSchedules.map((schedule) => {
          // FIX: Directly construct the UTC string. This avoids local timezone conversion.
          const startTime = schedule.startTime
            ? `1970-01-01T${schedule.startTime}:00.000Z`
            : null;
          const endTime = schedule.endTime
            ? `1970-01-01T${schedule.endTime}:00.000Z`
            : null;
          return { ...schedule, startTime, endTime };
        });
      }

      const updatedJob = await modifyPosition(job.id, payload);
      onSave(updatedJob);
    } catch (error) {
      console.error("Failed to modify position:", error);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Edit Job Position</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <DisplayField label={"Position ID"} value={job.id} />

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              {...register("location")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="locationType"
              className="block text-sm font-medium text-gray-700"
            >
              Location Type
            </label>
            <select
              id="locationType"
              {...register("locationType")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="INPERSON">In-Person</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="maxCAs"
              className="block text-sm font-medium text-gray-700"
            >
              Max CA's
            </label>
            <input
              type="number"
              id="maxCAs"
              {...register("maxCAs", { valueAsNumber: true })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                {...register("startDate")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                {...register("endDate")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <Controller
            name="jobSchedules"
            control={control}
            rules={{
              validate: validateSchedules,
            }}
            render={({ field }) => (
              <>
                <ScheduleEditor
                  initialSchedules={field.value}
                  onSchedulesChange={field.onChange}
                />
                {/* Display the error message if validation fails */}
                {errors.jobSchedules && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.jobSchedules.message}
                  </p>
                )}
              </>
            )}
          />

          <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
