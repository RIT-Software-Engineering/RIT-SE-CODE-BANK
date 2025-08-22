// src/components/positions/EmployerAndAdmin/form-steps/FormStepOne.js
'use client';

import { Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { getAllCourses, getAllPositions } from "@/services/db-apis";
import CreateCourseModal from "../CreateCourseModal";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Link as MuiLink,
} from "@mui/material";

/**
 * The first step in the multi-step form for creating a new job position.
 *
 * Includes fields for:
 * - Course Code (Autocomplete)
 * - Semester Code (number)
 * - Section Number (number)
 *
 * If the course code is not already in the database, the user is given the option
 * to create a new course. If the section number is already in use, the user is given
 * an error message.
 *
 * @param {Object} props - The props for the component.
 * @param {function} props.register - The register function from react-hook-form.
 * @param {function} props.control - The control function from react-hook-form.
 * @param {Object} props.errors - The errors object from react-hook-form.
 * @param {function} props.getValues - The getValues function from react-hook-form.
 * @param {function} props.setValue - The setValue function from react-hook-form.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode or not.
 * @returns {ReactNode} The form step component.
 */
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
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courses, positions] = await Promise.all([
          getAllCourses(),
          getAllPositions()
        ]);
        
        setAvailableCourses(courses);
        setAvailablePositions(positions);
      } catch (error) {
        console.error("Failed to fetch initial form data:", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (!isEditMode) {
        fetchInitialData();
    } else {
        const fetchCourses = async () => {
            try {
                const courses = await getAllCourses();
                setAvailableCourses(courses);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }
  }, [isEditMode]);

  const handleCourseCreated = (newCourse) => {
    setAvailableCourses((prev) => [...prev, newCourse]);
    setValue("courseCode", newCourse.courseCode, { shouldValidate: true });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Controller
          name="courseCode"
          control={control}
          rules={{
            required: "A course code is required.",
            minLength: { value: 8, message: "Course code must be 8 characters long (e.g. SWEN-261)." },
            maxLength: { value: 8, message: "Course code must be 8 characters long (e.g. SWEN-261)." },
            pattern: { value: /^[A-Z]+-\d+$/, message: "Format: DEPT-NUM (e.g., SWEN-261)." },
            validate: (value) =>
              availableCourses.some((course) => course.courseCode === value) || "NOT_FOUND",
          }}
          render={({ field, fieldState }) => (
            <Autocomplete
              {...field}
              options={availableCourses.map((option) => option.courseCode)}
              getOptionLabel={(option) => option}
              isOptionEqualToValue={(option, value) => option === value}
              onChange={(event, newValue) => field.onChange(newValue)}
              onInputChange={(event, newInputValue) => {
                  field.onChange(newInputValue.toUpperCase());
              }}
              freeSolo
              autoSelect
              loading={loadingCourses}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Course Code"
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message === "NOT_FOUND" ? (
                      <span>
                        Course not found.{" "}
                        <MuiLink
                          component="button"
                          type="button"
                          onClick={() => setCreateModalOpen(true)}
                        >
                          Create new?
                        </MuiLink>
                      </span>
                    ) : (
                      fieldState.error?.message
                    )
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCourses ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />

        <TextField
          fullWidth
          type="number"
          id="semesterCode"
          label="Semester Code"
          {...register("semesterCode", { required: "Semester Code is required." })}
          error={!!errors.semesterCode}
          helperText={errors.semesterCode?.message}
        />

        <TextField
          fullWidth
          type="number"
          id="sectionNumber"
          label="Section Number"
          {...register("sectionNumber", {
            required: "Section Number is required.",
            min: {
              value: 1,
              message: "Section number must be 1 or greater."
            },
            validate: (value) => {
              if (isEditMode) return true;
              const { courseCode, semesterCode } = getValues();
              if (!value || !courseCode || !semesterCode) return true;
              const newPositionId = `${semesterCode}-${courseCode}-${value}`;
              const alreadyExists = availablePositions.some(pos => pos.id === newPositionId);
              return !alreadyExists || "This job position already exists.";
            }
          })}
          error={!!errors.sectionNumber}
          helperText={errors.sectionNumber?.message}
        />
      </Box>

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        initialCode={getValues("courseCode")}
        onClose={() => setCreateModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />
    </Box>
  );
}