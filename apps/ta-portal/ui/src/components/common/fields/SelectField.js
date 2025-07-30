"use client";
import React from "react";

// Reusable styles from your InputField component
const formLabel = "block text-sm font-medium text-slate-700 mb-1";
const selectField = "w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

export default function SelectField({
  id,
  label,
  registerProps,
  error,
  required,
  children,
}) {
  return (
    <div>
      <label htmlFor={id} className={formLabel}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        {...registerProps}
        className={`${selectField} ${
          error ? "border-red-500" : "border-slate-300"
        }`}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}