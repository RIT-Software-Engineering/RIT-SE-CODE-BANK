// components/profile/form-steps/EmployerAndAdmin/Step1.js
"use client";
import React from "react";
import InputField from "../../../common/fields/InputField";
import DisplayField from "@/components/common/fields/DisplayField";

/** 
 * Component for the first step (and currently only step) of the form for employers and admins
 * @param {object} props - The component props.
 * @param {object} props.user - The user's profile data object.
 * @param {function} props.register - The form register function.
 * @param {object} props.errors - The form errors object.
 * @returns {JSX.Element} The rendered Step1 component.
*/
export default function Step1EmployerAndAdmin({ user, register, errors }) {
  return (
    <fieldset className="space-y-4 animate-fade-in">
      {/* --- NON-EDITABLE UID AND EMAIL FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DisplayField label="User ID" value={user?.uid} />
        <DisplayField label="Email" value={user?.email} />
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
          id="department"
          label="Department"
          placeholder="Enter Department"
          registerProps={register("department", { required: "Department is required." })}
          error={errors.department}
        />
      </div>
    </fieldset>
  );
}