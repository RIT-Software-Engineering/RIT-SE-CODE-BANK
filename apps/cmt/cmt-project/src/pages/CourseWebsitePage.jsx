import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";
import { Session, SessionModal, SessionTable } from "./course/Session";
import { Card } from "react-bootstrap";

export default function CourseWebsitePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  // headers: schedule, syllabus, project, resources

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

  // Fetch sessions and materials for selected course
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/session/${selectedCourse}`, {
          credentials: 'include',
        });
        const result = await res.json();

        if (result.success) {
          // Combine sessions with their materials for easier use in UI
          const combined = result.sessions.map((session, index) => ({
            ...session,
            materials: result.sessionMaterials[index]?.material || [],
          }));
          setSessions(combined);
        } else {
          setSessions([]);
          console.error("Failed to fetch sessions:", result.error);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [selectedCourse]);

  // the full course object to get course name & course id
  const selectedCourseObj = useMemo(() => {
    console.log("selectedCourse:", selectedCourse);
    console.log("courses:", courses);
    return courses.find(c => c.id === selectedCourse) || null;
  }, [selectedCourse, courses]);

  const EventLink = ({event}) => {
    // if event doesn't have a url, just return title
    if (!event.url) {
      return <span>{event.title}</span>;
    }

    return (
      <a href = {event.url} target = "_blank" rel="noreferrer" className = "text-blue-600 no-underline hover:no-underline visited:no-underline">
        {event.title}
      </a>
    );
  };

  const generateSessionRows = (materials) => {
    const cols = [
      "Topic/Lecture",
      "Class Activity",
      "Reading/Resources",
      "Projects & Practica",
      "Group Assignment",
      "Individual Assignment"
    ];

    const grouped = cols.map(col =>
      materials.filter(m => m.type === col && m.active)
    );

    const maxRows = Math.max(1, ...grouped.map(g => g.length));

    return Array.from({ length: maxRows }, (_, i) => `
      <tr>
        ${grouped.map(colItems => `
          <td>${colItems[i]?.label || ""}</td>
        `).join("")}
      </tr>
    `).join("");
  };

  const generateCourseHTML = (course, sessions) => {
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
        margin-bottom: 24px;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: left;
      }
      th {
        background: #d7d2cb;
      }
    </style>
  </head>
  <body>

  <h1>${course.id} – ${course.name}</h1>

  ${sessions.map(session => `
    <h2>Session ${session.sessionNum}</h2>
    <table>
      <thead>
        <tr>
          <th>Topic/Lecture</th>
          <th>Class Activity</th>
          <th>Reading/Resources</th>
          <th>Assignments</th>
        </tr>
      </thead>
      <tbody>
        ${generateSessionRows(session.materials)}
      </tbody>
    </table>
  `).join("")}

  </body>
  </html>`;
  };

  const downloadHTML = () => {
    if (!selectedCourseObj) return;

    const html = generateCourseHTML(selectedCourseObj, sessions);
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
              {course.name} ({course.season} {course.year})
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
      ) : Object.keys(sessions).length === 0 ? (
        <p className="text-gray-500 text-center">No events found for this course.</p>
      ) : (
        <table className="mx-auto w-full border-collapse">
          <thead className="bg-[#D7D2CB]">
            <tr>
              <th className="border border-gray-300 p-3 text-left">Session</th>
              <th className="border border-gray-300 p-3 text-left">Topics</th>
              <th className="border border-gray-300 p-3 text-left">Class Activities</th>
              <th className="border border-gray-300 p-3 text-left">Reading/Resources</th>
              <th className="border border-gray-300 p-3 text-left">Projects & Practica</th>
              <th className="border border-gray-300 p-3 text-left">Group Assignment</th>
              <th className="border border-gray-300 p-3 text-left">Individual Assignment</th>
            </tr>
          </thead>
          <tbody>
            {sessions
              .sort((a, b) => a.sessionNum - b.sessionNum)
              .map((session, index) => {
                const materials = session.materials || [];

                return (
                  <tr key={session.id} className={index % 2 === 0 ? "bg-red-100" : "bg-blue-100"}>
                    
                    {/* Session column */}
                    <td className="border border-gray-300 p-3 font-semibold text-center">
                      Session {session.sessionNum}
                    </td>

                    {/* Topics */}
                    <td className="border border-gray-300 p-3 align-top">
                      {materials
                        .filter(m => m.type === "Topic/Lecture" && m.active)
                        .map(m => (
                          <div key={m.id} className="mb-1">{m.label}</div>
                        ))}
                    </td>

                    {/* Class Activities */}
                    <td className="border border-gray-300 p-3 align-top">
                      {materials
                        .filter(m => m.type === "Class Activity" && m.active)
                        .map(m => (
                          <div key={m.id} className="mb-1">{m.label}</div>
                        ))}
                    </td>

                    {/* Reading/Resources */}
                    <td className="border border-gray-300 p-3 align-top">
                      {materials
                        .filter(m => m.type === "Reading/Resources" && m.active)
                        .map(m => (
                          <div key={m.id} className="mb-1">{m.label}</div>
                        ))}
                    </td>

                     {/* Projects & Practica */}
                     <td className="border border-gray-300 p-3 align-top">
                      {materials
                        .filter(m => m.type === "Projects & Practica" && m.active)
                        .map(m => (
                          <div key={m.id} className="mb-1">{m.label}</div>
                        ))}
                    </td>

                     {/* Group Assignment */}
                     <td className="border border-gray-300 p-3 align-top">
                      {materials
                        .filter(m => m.type === "Group Assignment" && m.active)
                        .map(m => (
                          <div key={m.id} className="mb-1">{m.label}</div>
                        ))}
                    </td>

                     {/* Individual Assignment */}
                     <td className="border border-gray-300 p-3 align-top">
                      {materials
                        .filter(m => m.type === "Individual Assignment" && m.active)
                        .map(m => (
                          <div key={m.id} className="mb-1">{m.label}</div>
                        ))}
                    </td>

                  </tr>
                );
              })}
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

const MATERIAL_COLUMNS = [
  "Topic/Lecture",
  "Class Activity",
  "Reading/Resources",
  "Projects & Practica",
  "Group Assignment",
  "Individual Assignment"
];

function buildSessionTableData(materials) {
  const grouped = MATERIAL_COLUMNS.map(col =>
    materials.filter(m => m.type === col && m.active)
  );

  const maxRows = Math.max(1, ...grouped.map(g => g.length));

  const rows = Array.from({ length: maxRows }, (_, i) =>
    grouped.map(colItems => colItems[i] || null)
  );

  return {
    columns: MATERIAL_COLUMNS,
    rows
  };
}

