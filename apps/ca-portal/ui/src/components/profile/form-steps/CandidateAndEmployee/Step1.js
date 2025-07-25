// components/profile/form-steps/CandidateAndEmployee/Step3.js
"use client";
import React from "react";
import InputField from "../../form-components/InputField";
import SelectField from "../../form-components/SelectField";

/**
 * Component for the first step of the form for candidates and employees
 * @param {object} props - The component props.
 * @param {object} props.user - The user's profile data object.
 * @param {function} props.register - The form register function.
 * @param {object} props.errors - The form errors object.
 * @param {object} props.watchedStatus - The form watched status object.
 * @returns {JSX.Element} The rendered Step1 component.
 */
export default function Step1CandidateAndEmployee({ user, register, errors, watchedStatus }) {
  return (
    <fieldset className="space-y-4 animate-fade-in">
      {/* --- NON-EDITABLE UID AND EMAIL FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">User ID (UID)</label>
          <div className="w-full bg-slate-100 text-slate-600 p-3 rounded-md border border-slate-200">
            {user?.uid}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <div className="w-full bg-slate-100 text-slate-600 p-3 rounded-md border border-slate-200">
            {user?.email}
          </div>
        </div>
      </div>

      {/* --- EDITABLE FIELDS --- */}
      <InputField
        id="fullName"
        label="Full Name"
        placeholder="Enter Full Name"
        registerProps={register("fullName", { required: "Full name is required." })}
        error={errors.fullName}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="pronouns"
          label="Pronouns"
          placeholder="Enter Pronouns"
          registerProps={register("pronouns", { required: "Pronouns are required." })}
          error={errors.pronouns}
        />
        <InputField
          id="major"
          label="Major"
          placeholder="Enter Major"
          registerProps={register("major", { required: "Major is required." })}
          error={errors.major}
        />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <SelectField
          id="graduateStatus"
          label="Academic Status"
          required={true}
          registerProps={register("graduateStatus", { required: "Academic status is required." })}
          error={errors.graduateStatus}
        >
          <option value="">Select Status...</option>
          <option value="UNDERGRADUATE">Undergraduate</option>
          <option value="GRADUATE">Graduate</option>
        </SelectField>

        {watchedStatus === "UNDERGRADUATE" && (
          <SelectField
            id="yearLevel"
            label="Year Level"
            required={true}
            registerProps={register("yearLevel", { required: "Year level is required for undergraduates." })}
            error={errors.yearLevel}
          >
            <option value="">Select Year...</option>
            <option value="2">Second Year</option>
            <option value="3">Third Year</option>
            <option value="4">Fourth Year</option>
            <option value="5">Fifth Year</option>
          </SelectField>
        )}
      </div>
    </fieldset>
  );
}