// components/profile/CoursesWorkedCard.js
import React from 'react';
import EditButton from '../../common/buttons/EditButton';

/**
 * A card component to display user Teaching Assistant information (candidate or employee).
 * @param {object} props - The component props.
 * @param {object[]} props.coursesTaken - The user's course data array.
 * @param {function} props.onEdit - The function to call when the edit icon is clicked.
 * @returns {JSX.Element} The rendered CoursesWorkedCard component.
 */
export default function CoursesWorkedCard({ coursesTaken, onEdit }) {
  const coursesWorked = coursesTaken.filter(
    (course) => course.wasPriorEmployee === true
  );

  return (
    <section className='bg-white rounded-xl shadow-lg border border-gray-200'>
      <div className='p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>Work History</h3>
          <EditButton handleOpenModal={onEdit} />
        </div>
        {coursesWorked.length === 0 ? (
          <p className='text-gray-500'>No previous work history found.</p>
        ) : (
          <ul className='space-y-4'>
            {coursesWorked.map((course) => (
              <li
                key={course.courseCode}
                className='border-b border-gray-200 pb-4 last:border-b-0'
              >
                <p className='text-md font-semibold text-gray-800'>
                  {course.courseCode} -{' '}
                  {course.name || 'No course name available'}
                </p>
                <p className='text-sm text-gray-600 mt-1'>
                  {course.description || 'No description provided'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
