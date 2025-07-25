// components/profile/form-steps/CandidateAndEmployee/Step3.js
"use client";
import React from "react";
import SearchBar from "../../../jobs/SearchBar";

// A dropdown component for selecting a grade that the user had gotten for a course 
const GradeSelector = ({ value, onChange }) => {
    const grades = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
    return (
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
            className="ml-4 p-2 border rounded-md bg-gray-50 text-sm"
        >
            <option value="">-- Select Grade --</option>
            {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
        </select>
    );
};

/**
 * Component for the second step of the form for candidates and employees.
 * @param {object} props - The component props.
 * @param {object[]} props.coursesTaken - The user's course data array.
 * @param {string} props.takenSearch - The search query for taken courses.
 * @param {function} props.setTakenSearch - The function to update the search query for taken courses.
 * @param {object[]} props.courseOptions - The list of available course options.
 * @param {function} props.addCourseTaken - The function to add a course to the user's taken courses.
 * @param {function} props.updateCourseGrade - The function to update the grade for a course.
 * @param {function} props.removeCourseTaken - The function to remove a course from the user's taken courses.
 * @returns {JSX.Element} The rendered Step2 component.
 */
export default function Step2CandidateAndEmployee({
  coursesTaken,
  takenSearch,
  setTakenSearch,
  courseOptions,
  addCourseTaken,
  updateCourseGrade,
  removeCourseTaken,
}) {
  const filteredTakenCourses = takenSearch
    ? courseOptions.filter(c => c.courseCode.toLowerCase().includes(takenSearch.toLowerCase()))
    : [];

  return (
    <fieldset className="space-y-2 animate-fade-in">
      <label className="block text-sm font-medium text-slate-700">Courses Taken</label>
      <p className="text-sm text-slate-500">Search for and add all relevant courses you have completed. You can optionally add your grade for each.</p>
      <SearchBar
        value={takenSearch}
        onChange={setTakenSearch}
        placeholder="Search for a course you have taken..."
      />
      {takenSearch && (
        <ul className="border rounded-md max-h-40 overflow-y-auto bg-white">
          {filteredTakenCourses.length > 0 ? (
            filteredTakenCourses.map((course) => (
              <li
                key={course.courseCode}
                onClick={() => addCourseTaken(course)}
                className="p-2 hover:bg-rit-light-gray cursor-pointer"
              >
                {course.courseCode}: {course.name}
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500">No courses found.</li>
          )}
        </ul>
      )}
      <div className="space-y-2 pt-2">
        {coursesTaken.map(({ courseCode, grade }) => (
          <div key={courseCode} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
            <span>{courseCode}</span>
            <div>
              <GradeSelector value={grade} onChange={(newGrade) => updateCourseGrade(courseCode, newGrade)} />
              <button
                type="button"
                onClick={() => removeCourseTaken(courseCode)}
                className="ml-4 text-red-500 hover:text-red-700 font-bold"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}