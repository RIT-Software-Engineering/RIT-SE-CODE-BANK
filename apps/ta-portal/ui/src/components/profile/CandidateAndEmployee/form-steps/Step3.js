// components/profile/form-steps/CandidateAndEmployee/Step3.js
"use client";
import React from "react";
import SearchBar from "../../../common/searchAndFilter/SearchBar";

/**
 * Component for Step 3 of the Candidate and Employee form
 * @param {object} props - The component props
 * @param {object[]} props.coursesWorked - The user's course data array
 * @param {string} props.workedSearch - The search query for worked courses
 * @param {function} props.setWorkedSearch - The function to update the search query for worked courses
 * @param {object[]} props.courseOptions - The list of available course options
 * @param {function} props.addCourseWorked - The function to add a course to the user's worked courses
 * @param {function} props.removeCourseWorked - The function to remove a course from the user's worked courses
 * @returns {JSX.Element} The rendered Step3 component
 */
export default function Step3CandidateAndEmployee({
  coursesWorked,
  workedSearch,
  setWorkedSearch,
  courseOptions,
  addCourseWorked,
  removeCourseWorked,
}) {
  const filteredWorkedCourses = workedSearch
    ? courseOptions.filter(c => c.courseCode.toLowerCase().includes(workedSearch.toLowerCase()))
    : [];

  return (
    <fieldset className="space-y-2 animate-fade-in">
      <label className="block text-sm font-medium text-slate-700">Prior TA/Grader Experience</label>
      <p className="text-sm text-slate-500">Add any courses for which you have previously worked as a Teaching Assistant or Grader.</p>
      <SearchBar
        value={workedSearch}
        onChange={setWorkedSearch}
        placeholder="Search for a course you have worked for..."
      />
      {workedSearch && (
        <ul className="border rounded-md max-h-40 overflow-y-auto bg-white">
          {filteredWorkedCourses.length > 0 ? (
            filteredWorkedCourses.map((course) => (
              <li
                key={course.courseCode}
                onClick={() => addCourseWorked(course)}
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
        {coursesWorked.map((courseCode) => (
          <div key={courseCode} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
            <span>{courseCode}</span>
            <button
              type="button"
              onClick={() => removeCourseWorked(courseCode)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}