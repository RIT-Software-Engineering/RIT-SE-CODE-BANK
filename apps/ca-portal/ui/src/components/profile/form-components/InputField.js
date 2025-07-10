// components/profile/form-components/InputField.js
"use client";
import React from "react";

const formLabel = "block text-sm font-medium text-slate-700 mb-1";
const inputField =
  "w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

export default function InputField({
  id,
  label,
  placeholder,
  registerProps,
  error,
  type = "text",
}) {
  return (
    <div>
      <label htmlFor={id} className={formLabel}>
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...registerProps}
        className={`${inputField} ${
          error ? "border-red-500" : "border-slate-300"
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}
