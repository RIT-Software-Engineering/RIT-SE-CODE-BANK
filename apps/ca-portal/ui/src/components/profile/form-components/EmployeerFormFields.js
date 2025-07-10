// components/profile/form-components/EmployeerFormFields.js
"use client";
import React from "react";
import InputField from "./InputField";

export default function EmployeerFormFields({ register, errors }) {
  return (
    <InputField
      id="department"
      label="Department"
      placeholder="Enter Department"
      registerProps={register("department", { required: "Department is required." })}
      error={errors.department}
    />
  );
}
