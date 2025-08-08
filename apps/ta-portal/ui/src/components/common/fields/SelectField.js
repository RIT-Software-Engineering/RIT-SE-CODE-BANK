"use client";
import React from "react";

// Base styles for the select field, with border color removed for conditional application.
const selectBase = "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

const formLabel = "block text-sm font-medium text-slate-700 mb-1";

export default function SelectField({
  id,
  label,
  registerProps,
  error,
  required = false,
  children,
}) {
  const errorId = `${id}-error`;
  const finalSelectClassName = `${selectBase} ${
    error ? "border-red-500" : "border-slate-300"
  }`;

  return (
    <div>
      <label htmlFor={id} className={formLabel}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        {...registerProps}
        className={finalSelectClassName}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-red-500 text-xs mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}