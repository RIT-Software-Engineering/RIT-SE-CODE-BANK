"use client";
import React, { useState, useEffect, useRef } from 'react';
import { gradeOptions } from '@/constants/gradeConstants';
import { ChevronsUpAndDownIcon } from '@/assets/icons';

/**
 * A custom dropdown component for selecting a grade from a predefined list.
 * This component does not allow free-text user input.
 * Displays a user-friendly label (e.g., "A-") but manages an internal enum value (e.g., "A_MINUS").
 * Designed for use with react-hook-form's Controller.
 */
export default function GradeSelector({ value, onChange, id, label, isOptional = false, error }) {
  const [isListVisible, setListVisible] = useState(false);
  const containerRef = useRef(null);

  // Find the display label corresponding to the current value from the form
  const currentOption = gradeOptions.find(opt => opt.value === value);
  const displayValue = currentOption ? currentOption.label : '';

  // Effect to handle clicking outside the component to close the list
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setListVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle selecting an item from the list
  const handleSelectOption = (option) => {
    // If an option is passed, update the form. Otherwise, clear it.
    onChange(option ? option.value : null);
    setListVisible(false); // Hide the list after selection
  };

  return (
    // Use a ref on a container div for relative positioning and outside click detection
    <div className="relative" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {isOptional && <span className="text-gray-500 text-xs ml-1">(Optional)</span>}
      </label>
      
      {/* The input is a button to prevent typing and act as a dropdown trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setListVisible(!isListVisible)}
        className={`mt-1 relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
        aria-haspopup="listbox"
        aria-expanded={isListVisible}
      >
        <span className={`block truncate ${displayValue ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayValue || 'Select a grade...'}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronsUpAndDownIcon />
        </span>
      </button>
      
      {/* Conditionally render our custom list. No filtering is needed anymore. */}
      {isListVisible && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full min-w-max overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {/* Add a "clear" option if the field is optional */}
          {isOptional && (
            <li
              onMouseDown={() => handleSelectOption(null)}
              className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
            >
              -- Clear Selection --
            </li>
          )}
          {gradeOptions.map((option) => (
            <li
              key={option.value}
              onMouseDown={() => handleSelectOption(option)}
              className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
            >
              <span className="block truncate">{option.label}</span>
            </li>
          ))}
        </ul>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}