export default function PrereqCheckboxes(){
    return(
        <div className="flex items-center my-4">
            <input
              id="prerequisite"
              name="prerequisite"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              {...register("courseTakenRequirement")}
            />
            <label
              htmlFor="prerequisite"
              className="ml-2 block text-sm text-gray-900"
            >
              Require this course as a prerequisite
            </label>
            <input
              id="graduateStudentPrerequisite"
              name="graduateStudentPrerequisite"
              type="checkbox"
              className="ml-4 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              {...register("courseTakenRequirement")}
            />
            <label
              htmlFor="graduateStudentPrerequisite"
              className="ml-2 block text-sm text-gray-900"
            >
              Is a graduate student
            </label>
          </div>
    )
}