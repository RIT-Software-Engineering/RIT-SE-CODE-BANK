import React, { useState, useEffect } from 'react';

// The predefined list of possible grades.
// The `value` is what will be stored and sent to the backend.
// The `label` is what the user sees in the dropdown.
const gradeOptions = [
  { value: 'A', label: 'A' },
  { value: 'A_MINUS', label: 'A-' },
  { value: 'B_PLUS', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'B_MINUS', label: 'B-' },
  { value: 'C_PLUS', label: 'C+' },
  { value: 'C', label: 'C' },
  { value: 'C_MINUS', label: 'C-' },
  { value: 'D', label: 'D' },
  { value: 'F', label: 'F (Not Recommended)' },
];

/**
 * A searchable dropdown component for selecting a minimum grade.
 * Shows a human-readable label but submits a machine-readable value.
 * Designed to be used with react-hook-form's Controller.
 * @param {object} props
 * @param {string} props.value - The current value of the input, provided by Controller.
 * @param {function} props.onChange - The function to call when the value changes, provided by Controller.
 * @param {string} props.id - The HTML id for the input and datalist.
 * @param {string} props.label - The label to display for the form field.
 */
export default function GradeSelector({ value, onChange, id, label }) {
  // State to hold the visible text in the input field (e.g., "A-")
  const [displayValue, setDisplayValue] = useState('');

  // When the form's actual value changes, update the visible display value
  useEffect(() => {
    const currentOption = gradeOptions.find(opt => opt.value === value);
    setDisplayValue(currentOption ? currentOption.label : '');
  }, [value]);

  // Handle changes from the user typing or selecting from the list
  const handleInputChange = (e) => {
    const newDisplayValue = e.target.value;
    setDisplayValue(newDisplayValue); // Update what the user sees immediately

    // Find the corresponding option based on the visible label
    const selectedOption = gradeOptions.find(opt => opt.label === newDisplayValue);

    // Update the parent form's state with the actual value (e.g., "A_MINUS"),
    // or null if the input is not a valid grade label.
    onChange(selectedOption ? selectedOption.value : null);
  };

  return (
    <div className='w-1/2'>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="text"
        id={id}
        list={`${id}-datalist`}
        value={displayValue} // The input now shows the user-friendly label
        onChange={handleInputChange} // Use our custom handler to manage the state
        placeholder="Type or select a grade..."
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
      <datalist id={`${id}-datalist`}>
        {gradeOptions.map((option) => (
          // The value of the option is the label, so it populates the input correctly
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}