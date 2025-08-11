import { Controller } from "react-hook-form";
import GradeSelector from "../../../common/fields/GradeSelector";
import PrerequisiteCheckboxes from "../form-components/PrerequisiteCheckboxes";

export default function FormStepTwo({ register, control }) {
  return (
    <div>
      <PrerequisiteCheckboxes register={register} control={control} />
      <Controller
        name="gradeRequirement"
        control={control}
        render={({ field, fieldState }) => (
          <GradeSelector
            {...field}
            id="gradeRequirement"
            label="Minimum Grade Required"
            isOptional={true}
            error={fieldState.error}
          />
        )}
      />
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
          htmlFor="maxTAs"
          className="block text-sm font-medium text-gray-700"
        >
          Max TA&apos;s
        </label>
        <input
          type="number"
          id="maxTAs"
          {...register("maxTAs", { valueAsNumber: true })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
}
