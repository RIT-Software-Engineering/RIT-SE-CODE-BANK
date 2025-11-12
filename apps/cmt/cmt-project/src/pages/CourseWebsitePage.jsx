import React, { useEffect, useMemo, useState } from "react";
const API_BASE = `${process.env.REACT_APP_BACKEND_URL}`;

// Helper to get week number relative to semester start
const getWeekNumber = (date, start) => {
  const diff = new Date(date) - new Date(start);
  const week = Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
  return week > 0 ? week : 1;
};

export default function CourseWebsitePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // need to change
  const [semesterStart, setSemesterStart] = useState("2025-08-25");

  // Fetch courses
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/events/courses`);
        const result = await res.json();
        if (result.success) setCourses(result.data);
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    })();
  }, []);

  // Fetch events for selected course
  useEffect(() => {
    if (!selectedCourse) return;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/course-website/${selectedCourse}/events`);
        const result = await res.json();
        if (result.success) setEvents(result.data);
        else setEvents([]);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedCourse]);

  // Group events by week
  const eventsByWeek = useMemo(() => {
    const grouped = {};
    for (const e of events) {
      const week = getWeekNumber(e.date, semesterStart);
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(e);
    }
    // Sort events by date within each week
    for (const week in grouped) {
      grouped[week].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return grouped;
  }, [events, semesterStart]);

  return (
    <div>
      <h1 className="text-center">Course Schedule</h1>

      {/* Course Selector */}
      <div>
        <select
          className="border rounded-lg p-2 text-lg"
          value={selectedCourse || ""}
          onChange={(e) => setSelectedCourse(e.target.value)}>
          <option value="" disabled>Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.semester})
            </option>
          ))}
        </select>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="text-center p-6">Loading events...</div>
      ) : Object.keys(eventsByWeek).length === 0 ? (
        <p className="text-gray-500 text-center">No events found for this course.</p>
      ) : (
        <table className="mx-auto w-full border-collapse">
          <thead className="bg-[#D7D2CB]">
            <tr>
              <th className="border border-gray-300 p-3 text-left">Week</th>
              <th className="border border-gray-300 p-3 text-left">Topics</th>
              <th className="border border-gray-300 p-3 text-left">Class Activities</th>
              <th className="border border-gray-300 p-3 text-left">Assignments</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(eventsByWeek).map(([week, weekEvents], index) => (
              <tr
                key={week}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {/* Week number column */}
                <td className="border border-gray-300 p-3 font-semibold text-center">
                  Week {week}
                </td>

                {/* Lectures */}
                <td className="border border-gray-300 p-3 align-top">
                  {weekEvents
                    .filter(e => e.type === "lecture" || e.type === "exam")
                    .map(e => (
                      <div key={e.id} className="mb-1">{e.title}</div>
                    ))}
                </td>

                {/* Class activities */}
                <td className="border border-gray-300 p-3 align-top">
                  {weekEvents
                    .filter(e => e.type === "class_activity")
                    .map(e => (
                      <div key={e.id} className="mb-1">{e.title}</div>
                    ))}
                </td>

                {/* Assignments + other things */}
                <td className="border border-gray-300 p-3 align-top">
                  {weekEvents
                    .filter(e =>
                      ["assignment", "quiz", "project", "lab"].includes(e.type)
                    )
                    .map(e => (
                      <div key={e.id} className="mb-1">
                        <div>{e.title} - Due:{" "} 
                          {new Date(e.date).toLocaleDateString("en-US", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      )}
    </div>
  );
}
