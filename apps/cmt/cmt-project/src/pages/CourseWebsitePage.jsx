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
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${course.id} - ${course.name}</title>
    </head>
    <body>

      <h1>${course.id} - ${course.name}</h1>

      ${sessions
        .sort((a, b) => a.sessionNum - b.sessionNum)
        .map(generateSessionHTML)
        .join("")}

    </body>
    </html>
    `;
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

  const visibleColumns = MATERIAL_COLUMNS.filter(col =>
    sessions.some(session =>
      (session.materials || []).some(m => m.type === col && m.active)
    )
  );

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
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 text-center">No events found for this course.</p>
      ) : (
        <table className="mx-auto w-full border-collapse">
          <thead className="bg-[#D7D2CB]">
            <tr>
              <th className="border border-gray-300 p-3 text-left">Session</th>
                {visibleColumns.map(col => (
                  <th key={col} className="border border-gray-300 p-3 text-left">
                    {col}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {sessions
              .sort((a, b) => a.sessionNum - b.sessionNum)
              .map((session, index) => {
                const materials = session.materials || [];
                const grouped = visibleColumns.map(col => materials.filter(m => m.type === col && m.active));
                return (
                  <tr key={session.id} className={index % 2 === 0 ? "bg-red-100" : "bg-blue-100"}>   

                    <td className="border border-gray-300 p-3 font-semibold text-center">
                      Session {session.sessionNum}
                    </td>

                    {grouped.map((colItems, colIndex) => (
                      <td key={colIndex} className="border border-gray-300 p-3 align-top">
                        {colItems.map(item => (
                          <div key={item.id} className="mb-1">{item.label}</div>
                        ))}
                      </td>
                    ))}
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

function generateSessionHTML(session) {
  const { columns, rows } = buildSessionTableData(session.materials);

  return `
    <h2>Session ${session.sessionNum}</h2>
    <table>
      <thead>
        <tr>
          ${columns.map(col => `<th>${col}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell ? cell.label : ""}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

