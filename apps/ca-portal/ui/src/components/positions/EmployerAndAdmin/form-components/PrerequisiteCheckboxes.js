import React from 'react';
import { Controller } from 'react-hook-form';

/**
 * A component for setting job prerequisites, with corrected form registration
 * and custom value handling for the graduate status checkbox.
 * @param {object} props
 * @param {function} props.register - The `register` function from react-hook-form.
 * @param {object} props.control - The `control` object from react-hook-form.
 */
export default function PrerequisiteCheckboxes({ register, control }) {
  // This is a guard clause. If the control object isn't passed from the parent,
  // we render nothing to prevent the application from crashing.
  if (!control) {
    console.error("PrerequisiteCheckboxes is missing the 'control' prop from react-hook-form.");
    return null;
  }

  return (
    <div className="flex items-center my-4 space-x-6">
      
      {/* Checkbox 1: Standard boolean for course requirement */}
      <div className="flex items-center">
        <input
          id="courseTakenRequirement"
          type="checkbox"
          // This correctly registers the field and will return true/false.
          {...register("courseTakenRequirement")}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label
          htmlFor="courseTakenRequirement"
          className="ml-2 block text-sm text-gray-900"
        >
          Require this course as a prerequisite
        </label>
      </div>

      {/* Checkbox 2: Custom string value for graduate status */}
      <div className="flex items-center">
        {/* We use a Controller to intercept and transform the value */}
        <Controller
          name="graduateStatusRequirement" // Use the correct, unique field name
          control={control}
          render={({ field }) => (
            <input
              id="graduateStudentPrerequisite"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              // Determine if the box is checked by comparing the form's value
              checked={field.value === 'GRADUATE'}
              // When the user clicks, call the form's onChange with the correct string
              onChange={(e) => {
                const newValue = e.target.checked ? 'GRADUATE' : 'UNDERGRADUATE';
                field.onChange(newValue);
              }}
            />
          )}
        />
        <label
          htmlFor="graduateStudentPrerequisite"
          className="ml-2 block text-sm text-gray-900"
        >
          Require graduate student
        </label>
      </div>
    </div>
  );
}
