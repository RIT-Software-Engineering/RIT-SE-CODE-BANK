// components/profile/CoursesTakenCard.js
import React from 'react';
import EditButton from '../../common/buttons/EditButton';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';


/**
 * A card component to display user course information (candidate or employee).
 * @param {object} props - The component props.
 * @param {object[]} props.coursesTaken - The user's course data array.
 * @param {function} props.onEdit - The function to call when the edit icon is clicked.
 * @returns {JSX.Element} The rendered CoursesTakenCard component.
 */
export default function CoursesTakenCard({ coursesTaken, onEdit }) {
  const gradedCourses = coursesTaken.filter(course => course.hasTaken === true);

  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Courses Taken</h3>
          <EditButton handleOpenModal={onEdit} />
        </div>
        {gradedCourses.length === 0 ? (
          <p className="text-gray-500">No graded courses taken found.</p>
        ) : (
          <ul className="space-y-4">
            {gradedCourses.map((course) => (
              <li key={course.courseCode} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex-grow">
                  <p className="text-md font-semibold text-gray-800">{course.courseCode} - {course.name || "No course name available"}</p>
                  <p className="text-sm text-gray-600 mt-1">{course.description || "No description provided"}</p>
                </div>
                {(course.grade && gradeEnumToStringValue[course.grade]) && <span className="ml-4 bg-rit-orange text-white text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap">Grade: {gradeEnumToStringValue[course.grade]}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
