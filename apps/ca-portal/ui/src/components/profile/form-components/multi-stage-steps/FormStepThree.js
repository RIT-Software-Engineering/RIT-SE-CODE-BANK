import { Controller } from "react-hook-form";
import ScheduleEditor from "../../form-components/ScheduleEditor";
export default function FormStepThree({ register, control, errors }) {
  return (
    <div>
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
        // rules={{
        //   validate: validateSchedules,
        // }}
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
    </div>
  );
}
