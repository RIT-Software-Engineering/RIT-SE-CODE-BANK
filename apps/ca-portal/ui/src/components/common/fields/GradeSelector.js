"use client";
import React from 'react';
import { gradeOptions } from '@/constants/gradeConstants';

/**
 * A simple, native dropdown component for selecting a grade from a predefined list.
 * This version uses the standard HTML <select> element for maximum simplicity and accessibility.
 */
export default function GradeSelector({ value, onChange, id, label, isOptional = false, error }) {
  
  const handleChange = (event) => {
    onChange(event.target.value || null);
  };

  // Define the TailwindCSS classes for styling the <select> element.
  const selectClasses = `mt-1 block w-full rounded-md border shadow-sm py-2 pl-3 pr-10 text-base focus:outline-none sm:text-sm ${
    error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
  }`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {isOptional && <span className="text-gray-500 text-xs ml-1">(Optional)</span>}
      </label>

      <select
        id={id}
        value={value || ''}
        onChange={handleChange}
        className={selectClasses}
      >
        <option value="">
          {isOptional ? '-- No Grade --' : 'Select a grade...'}
        </option>

        {gradeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}