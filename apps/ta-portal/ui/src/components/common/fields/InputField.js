// components/profile/form-components/InputField.js
"use client";
import React from "react";

const inputBase = "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
const formLabel = "block text-sm font-medium text-slate-700 mb-1";

export default function InputField({
  id,
  label,
  placeholder,
  registerProps,
  error,
  type = "text",
  required = false,
  minLength,
  maxLength,
  ...rest
}) {
  const errorId = `${id}-error`;
  const finalInputClassName = `${inputBase} ${
    error ? "border-red-500" : "border-slate-300"
  }`;

  const handleChange = (e) => {
    let value = e.target.value;
    if (rest.inputMode === 'numeric' && value) {
      value = value.replace(/[^0-9]/g, '');
    }

    if (type === 'number' && maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    e.target.value = value;
    
    registerProps?.onChange?.(e);
  };

  return (
    <div>
      <label htmlFor={id} className={formLabel}>
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        {...registerProps}
        onChange={handleChange}
        className={finalInputClassName}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-red-500 text-xs mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
