export default function CoursesTakenCard({ coursesTaken }) {
  // "CANDIDATE" or "EMPLOYEE" previous courses taken

  return (
    <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Courses Taken
        </h3>
        {coursesTaken.length === 0 ? (
          <p className="text-gray-500">No previous courses taken found.</p>
        ) : (
          <ul className="space-y-4">
            {coursesTaken.map((course) => (
              <li
                key={course.courseCode}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <p className="text-md font-semibold text-gray-800">
                  {course.courseCode} -{" "}
                  {course.name || "No course name available"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {course.description || "No description provided"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
