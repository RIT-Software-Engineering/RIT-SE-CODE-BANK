// app/components/UserProfileForm.js
"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import {
  upsertCandidateProfile,
  upsertEmployerProfile,
} from "@/services/db-apis";

// Import the reusable sub-components for the form
import InputField from "./form-components/InputField";
import CandidateFormFields from "./form-components/CandidateFormFields";
import EmployeerFormFields from "./form-components/EmployeerFormFields";

export default function UserProfileForm({
  user,
  mode,
  onClose,
  courseOptions,
  onUpdateSuccess,
}) {
  const isEditMode = mode === "edit";
  const userRole = user?.role?.toUpperCase().trim();
  const { refreshUserProfile } = useAuth();
  const isCandidateOrEmployee =
    userRole === "CANDIDATE" || userRole === "EMPLOYEE";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  // This effect sets the form's default values when the user data is available.
  useEffect(() => {
    if (user) {
      const defaultValues = isCandidateOrEmployee
        ? {
            // Defaults for CANDIDATE or EMPLOYEE
            fullName: user.name || "",
            pronouns: user.pronouns || "",
            major: user.candidate?.major || "",
            yearLevel: user.candidate?.year || "",
            // FIX: This now handles both nested `{course: {courseCode: ...}}` and flat `{courseCode: ...}` structures.
            courses:
              user.candidate?.courseHistory?.map(
                (ch) => ch.course?.courseCode || ch.courseCode
              ) || [],
            graduateStatus: user.candidate?.graduateStatus || "",
            isEmployee: user.candidate?.wasPriorEmployee ? "yes" : "no",
            coursesWorked:
              user.candidate?.courseHistory
                ?.filter((ch) => ch.wasPriorEmployee)
                .map((ch) => ch.course?.courseCode || ch.courseCode) || [],
          }
        : {
            // Defaults for EMPLOYER or ADMIN
            fullName: user.name || "",
            pronouns: user.pronouns || "",
            department: user.employer?.department || "",
          };
      reset(defaultValues);
    }
  }, [user, reset, isCandidateOrEmployee]);

  /**
   * Handles form submission for CANDIDATE/EMPLOYEE profiles.
   */
  const onSubmitCandidate = async (data) => {
    try {
      let year;
      if (data.graduateStatus === "GRADUATE") {
        year = 6;
      } else if (data.yearLevel) {
        year = parseInt(data.yearLevel, 10);
        if (isNaN(year)) throw new Error("Invalid year level Interview.");
      } else {
        throw new Error("Year level is required for undergraduate candidates.");
      }

      const finalData = {
        uid: user.uid,
        name: data.fullName,
        email: user.email,
        pronouns: data.pronouns,
        year: year,
        major: data.major,
        graduateStatus: data.graduateStatus,
        wasPriorEmployee: data.isEmployee === "yes",
        courseHistory: data.courses.map((courseCode) => ({
          courseCode: courseCode,
          grade: "A", // Placeholder grade
          wasPriorEmployee: data.coursesWorked?.includes(courseCode) || false,
        })),
      };

      const updatedProfile = await upsertCandidateProfile(finalData);

      if (onUpdateSuccess) onUpdateSuccess(updatedProfile);

      alert("Profile saved!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert(`Error: Could not save profile. ${error.message}`);
    }
  };

  /**
   * Handles form submission for EMPLOYER/ADMIN profiles.
   */
  const onSubmitEmployeer = async (data) => {
    try {
      const finalData = {
        uid: user.uid,
        name: data.fullName,
        email: user.email,
        pronouns: data.pronouns,
        department: data.department,
        role: user.role,
      };
      const updatedProfile = await upsertEmployerProfile(finalData);

      if (onUpdateSuccess) onUpdateSuccess(updatedProfile);

      alert("Profile saved!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to submit employeer form:", error);
      alert(`Error: Could not save profile. ${error.message}`);
    }
  };

  const onSubmit = isCandidateOrEmployee ? onSubmitCandidate : onSubmitEmployeer;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 sm:p-8 flex-grow overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold text-slate-900">
              {isEditMode
                ? `Edit ${
                    userRole.charAt(0).toUpperCase() +
                    userRole.slice(1).toLowerCase()
                  } Profile`
                : "Complete Your Profile"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-3xl leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-slate-500 mb-8">
            {isCandidateOrEmployee && !isEditMode
              ? "Please fill in all required information."
              : "Update your details below."}
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-6"
          >
            {/* --- Basic Info Section --- */}
            <fieldset className="space-y-4">
              <InputField
                id="fullName"
                label="Full Name"
                placeholder="Enter Full Name"
                registerProps={register("fullName", {
                  required: "Full name is required.",
                })}
                error={errors.fullName}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  id="pronouns"
                  label="Pronouns"
                  placeholder="Enter Pronouns"
                  registerProps={register("pronouns", {
                    required: "Pronouns are required.",
                  })}
                  error={errors.pronouns}
                />
                {isCandidateOrEmployee ? (
                  <InputField
                    id="major"
                    label="Major"
                    placeholder="Enter Major"
                    registerProps={register("major", {
                      required: "Major is required.",
                    })}
                    error={errors.major}
                  />
                ) : (
                  <EmployeerFormFields register={register} errors={errors} />
                )}
              </div>
            </fieldset>

            {/* --- Candidate/Employee Specific Section --- */}
            {isCandidateOrEmployee && (
              <CandidateFormFields
                register={register}
                errors={errors}
                control={control}
                courseOptions={courseOptions}
              />
            )}

            {/* --- Submit Button --- */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-rit-orange text-white font-bold py-3 px-4 rounded-lg hover:bg-rit-orange focus:outline-none focus:ring-4 focus:ring-rit-light-gray transition-all duration-300 ease-in-out disabled:bg-rit-dark-gray disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
