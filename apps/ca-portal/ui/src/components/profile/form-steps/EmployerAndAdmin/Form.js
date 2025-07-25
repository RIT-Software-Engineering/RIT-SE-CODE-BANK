// components/profile/form-steps/EmployerAndAdmin/Step1.js
"use client";
import React from "react";
import InputField from "../../form-components/InputField";


export default function Form({ user, register, errors }) {
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