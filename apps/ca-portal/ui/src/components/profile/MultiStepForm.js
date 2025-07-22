import FormStepOne from "./form-components/multi-stage-steps/FormStepOne";
import FormStepTwo from "./form-components/multi-stage-steps/FormStepTwo";
import DisplayField from "../ui/DisplayField";
import { useState, useEffect } from "react";
import FormStepThree from "./form-components/multi-stage-steps/FormStepThree";
export default function MultiStepForm({
  onSubmit,
  onClose,
  isEditMode,
  job,
  formMethods,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = formMethods;

  const handleNext = async (event) => {
    event.preventDefault(); // Prevent default form submission
    // Define which fields belong to each step for targeted validation
    const fieldsByStep = {
      1: [
        "courseCode",
        "sectionNumber",
        "semesterCode",
        "location",
        "locationType",
        "maxCAs",
      ],
      2: ["startDate", "endDate", "jobSchedules"],
    };

    const fieldsToValidate = fieldsByStep[currentStep];
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
    setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };
  // Automatically skip to step 2 in edit mode
  useEffect(() => {
    if (isEditMode) {
      setCurrentStep(2);
    }
  }, [isEditMode]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isEditMode && <DisplayField label={"Position ID"} value={job.id} />}
      {/* Inputs for creating a new course */}
      {currentStep === 1 && !isEditMode && (
        <FormStepOne
          getValues={getValues}
          setValue={setValue}
          register={register}
          errors={errors}
          control={control}
          isEditMode={isEditMode}
        />
      )}
      {currentStep === 2 && (
        <FormStepTwo register={register} control={control} errors={errors} />
      )}
      {currentStep === 3 && (
        <FormStepThree register={register} control={control} errors={errors} />
      )}

      <div className="flex justify-between pt-6 border-t mt-8">
        <div>
          {(currentStep > 1 && !isEditMode || currentStep == 3) ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 rounded-md font-semibold"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md font-semibold"
            >
              Cancel
            </button>
          )}
        </div>

        <div>
          {currentStep < 3 ? (
            <div>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold"
              >
                Next
              </button>
            </div>
          ) : (
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Position"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
