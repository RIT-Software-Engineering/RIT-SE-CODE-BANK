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
        <DisplayField label="User Name" value={user?.username} />
        <DisplayField label="Password" value={user?.password} />
      </div>

      {/* --- EDITABLE FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="fname"
          label="First Name"
          placeholder="Enter First Name"
          registerProps={register("fname", { required: "First name is required." })}
          error={errors.fname}
        />
        <InputField
          id="lname"
          label="Last Name"
          placeholder="Enter Last Name"
          registerProps={register("lname", { required: "Last name is required." })}
          error={errors.lname}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="uid"
          label="User ID"
          type="number"
          placeholder="Enter User ID"
          registerProps={register("uid", { required: "A User ID is required." })}
          error={errors.uid}
        />
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="Enter Email"
          registerProps={register("email", { required: "An email is required." })}
          error={errors.email}
        />
      </div>
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