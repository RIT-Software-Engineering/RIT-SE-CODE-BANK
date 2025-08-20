// src/components/positions/EmployerAndAdmin/MultiStepForm.js
'use client';

import FormStepOne from "./form-steps/FormStepOne";
import FormStepTwo from "./form-steps/FormStepTwo";
import FormStepThree from "./form-steps/FormStepThree";
import DisplayField from "../../common/fields/DisplayField";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
} from "@mui/material";

const steps = ["Course Details", "Position Logistics", "Schedule"];

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
    event.preventDefault();
    const fieldsByStep = {
      1: ["courseCode", "sectionNumber", "semesterCode"],
      2: ["location", "locationType", "maxTAs", "gradeRequirement", "courseTakenRequirement"],
    };

    const fieldsToValidate = fieldsByStep[currentStep];
    
    if (fieldsToValidate) {
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  useEffect(() => {
    if (isEditMode) {
      setCurrentStep(2);
    }
  }, [isEditMode]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {!isEditMode && (
        <Stepper activeStep={currentStep - 1} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {isEditMode && <DisplayField label={"Position ID"} value={job.id} />}
      
      <Box sx={{ minHeight: 300, p: 1 }}>
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
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
        <Button
          onClick={ (currentStep > 1 && !isEditMode) || currentStep === 3 ? handleBack : onClose }
          disabled={isSubmitting}
        >
          { (currentStep > 1 && !isEditMode) || currentStep === 3 ? "Back" : "Cancel" }
        </Button>

        {currentStep < 3 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? "Save Changes" : "Create Position")}
          </Button>
        )}
      </Box>
    </Box>
  );
}