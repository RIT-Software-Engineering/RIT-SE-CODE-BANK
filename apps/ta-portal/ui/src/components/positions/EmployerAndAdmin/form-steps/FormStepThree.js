import { Controller } from "react-hook-form";
import ScheduleEditor from "../form-components/ScheduleEditor";

export default function FormStepThree({ register, control, errors }) {
  console.log("FormStepThree current form values:", control._defaultValues);
  return (
    <div className="space-y-6">
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
            {...register("startDate", {
              required: "Start date is required.",
            })}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm ${
              errors.startDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {/* Add this block to display the error message for startDate */}
          {errors.startDate && (
            <p className="text-red-500 text-xs mt-1">
              {errors.startDate.message}
            </p>
          )}
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
            {...register("endDate", {
              required: "End date is required.",
            })}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm ${
              errors.endDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs mt-1">
              {errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      <Controller
        name="jobSchedules"
        control={control}
        render={({ field }) => (
          <>
            <ScheduleEditor
              initialSchedules={field.value}
              onSchedulesChange={field.onChange}
            />
            {errors.jobSchedules && (
              <p className="mt-2 text-sm text-red-600">
                {errors.jobSchedules.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
}
