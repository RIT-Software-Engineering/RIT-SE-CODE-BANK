import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";

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
  // headers: schedule, syllabus, project, resources
  const [selectedHeader, setSelectedHeader] = useState("Schedule")
  const headerTitles = {
    schedule: "Course Schedule",
    syllabus: "Syllabus",
    project: "Project Overview",
    resources: "Course Resources"
  }

  // need to change
  const [semesterStart, setSemesterStart] = useState("2025-08-25");

  // Fetch courses
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/events/courses`, {
          credentials: 'include',
        });
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
        const res = await fetch(`${API_BASE}/course-website/${selectedCourse}/events`, {
          credentials: 'include',
        });
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

  // the full course object to get course name & course id
  const selectedCourseObj = useMemo(() => {
    console.log("selectedCourse:", selectedCourse);
    console.log("courses:", courses);
    return courses.find(c => c.id === selectedCourse) || null;
  }, [selectedCourse, courses]);

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


  const EventLink = ({event}) => {
    // if event doesn't have a url, just return title
    if (!event.url) {
      return <span>{event.title}</span>;
    }

    return (
      <a href = {event.url} target = "_blank" className = "text-blue-600 no-underline hover:no-underline visited:no-underline">
        {event.title}
      </a>
    );
  };

  const generateCourseHTML = (course, eventsByWeek) => {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${course.id} - ${course.name}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 24px;
      }
      h1 {
        text-align: center;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: left;
      }
      th {
        background: #d7d2cb;
      }
      tr:nth-child(even) td {
        background: #f9f9f9;
      }
      a {
        color: #1d4ed8;
        text-decoration: none;
      }
    </style>
  </head>
  <body>

  <h1>${course.id} – ${course.name}</h1>

  <table>
    <thead>
      <tr>
        <th>Week</th>
        <th>Topics</th>
        <th>Class Activities</th>
        <th>Assignments</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(eventsByWeek)
        .map(([week, events]) => `
          <tr>
            <td>Week ${week}</td>
            <td>
              ${events
                .filter(e => e.type === "lecture" || e.type === "exam")
                .map(e => e.url ? `<a href="${e.url}">${e.title}</a>` : e.title)
                .join("<br />")}
            </td>
            <td>
              ${events
                .filter(e => e.type === "class_activity")
                .map(e => e.url ? `<a href="${e.url}">${e.title}</a>` : e.title)
                .join("<br />")}
            </td>
            <td>
              ${events
                .filter(e => ["assignment", "quiz", "project", "lab"].includes(e.type))
                .map(e => `${e.url ? `<a href="${e.url}">${e.title}</a>` : e.title} (Due ${new Date(e.date).toLocaleDateString("en-US",{month:"numeric",day:"numeric"})})`)
                .join("<br />")}
            </td>
          </tr>
        `)
        .join("")}
    </tbody>
  </table>
  </body>
  </html>`
  };

  const downloadHTML = () => {
    if (!selectedCourseObj) return;

    const html = generateCourseHTML(selectedCourseObj, eventsByWeek);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCourseObj.id}-course-website.html`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
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

      <hr></hr>

      <h1 className="text-center">
        {selectedCourseObj ? `${selectedCourseObj.id} - ${selectedCourseObj.name}` : ""}
      </h1>

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
            {Object.entries(eventsByWeek)
              .sort(([aWeek], [bWeek]) => Number(aWeek) - Number(bWeek))
              .map(([week, weekEvents], index) => (
              <tr key={week} className={index % 2 === 0 ? "bg-red-100" : "bg-blue-100"}>
                {/* Week number column */}
                <td className="border border-gray-300 p-3 font-semibold text-center">
                  Week {week}
                </td>

                {/* Lectures */}
                <td className="border border-gray-300 p-3 align-top">
                  {weekEvents
                    .filter(e => e.type === "lecture" || e.type === "exam")
                    .map(e => (
                      <div key={e.id} className="mb-1"><EventLink event = {e}></EventLink></div>
                    ))}
                </td>

                {/* Class activities */}
                <td className="border border-gray-300 p-3 align-top">
                  {weekEvents
                    .filter(e => e.type === "class_activity")
                    .map(e => (
                      <div key={e.id} className="mb-1"><EventLink event = {e}></EventLink></div>
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
                        <EventLink event = {e}></EventLink> - Due:{" "} 
                        {new Date(e.date).toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                          })}
                        </div>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className = "text-center">
        <button 
          onClick={downloadHTML}
          className="mt-6 px-4 py-2 text-black rounded">
          Download Course Website (HTML)
        </button>
      </div>
    </div>
  );
}