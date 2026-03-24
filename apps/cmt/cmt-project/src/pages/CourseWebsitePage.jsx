// @ts-ignore
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";
import { ReadOnlyEditor } from "../components/RichTextEditor/RichTextEditor";

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


  // Helper component to render event title as a link if URL exists - not currently used but may be useful in the future if we want to link to external resources
  // const EventLink = ({event}) => {
  //   // if event doesn't have a url, just return title
  //   if (!event.url) {
  //     return <span>{event.title}</span>;
  //   }

  //   return (
  //     <a href = {event.url} target = "_blank" rel="noreferrer" className = "text-blue-600 no-underline hover:no-underline visited:no-underline">
  //       {event.title}
  //     </a>
  //   );
  // };

  const generateCourseHTML = (course, sessions) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${course.classId}-${course.section} | ${course.name}</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        h1 {
          text-align: center;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background-color: #0484c9;
          color: white;
          padding: 10px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }

        td:first-child {
          text-align: center;
          vertical-align: middle;
          font-weight: bold;
        }

        td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          vertical-align: top;
        }

        tr:nth-child(even) {
          background-color: #f3f4f6;
        }
      </style>
    </head>
    <body>

      <h1>${course.classId}-${course.section} | ${course.name}</h1>

      <table>
        <thead>
          <tr>
            <th>Session</th>
            ${visibleColumns.map(col => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${sessions
            .sort((a, b) => a.sessionNum - b.sessionNum)
            .map(session => generateSessionRowHTML(session, visibleColumns))
            .join("")}
        </tbody>
      </table>

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
    a.download = `${selectedCourseObj.classId}-${selectedCourseObj.section}-course-website.html`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

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
          onChange={(e) => setSelectedCourse(Number(e.target.value))}>
          <option value="" disabled>Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.classId}-{course.section} | {course.name} ({course.season} {course.year})
            </option>
          ))}
        </select>
      </div>

      <hr></hr>

      <h1 className="text-center">
        {selectedCourseObj ? `${selectedCourseObj.classId}-${selectedCourseObj.section} | ${selectedCourseObj.name}` : ""}
      </h1>

      {/* Events Table */}
      {loading ? (
        <div className="text-center p-6">Loading events...</div>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 text-center">No events found for this course.</p>
      ) : (
        <table className="mx-auto w-full border-collapse">
          <thead className="[&>tr>th]:text-white [&>tr>th]:font-bold [&>tr>th]:bg-[#0484c9]">
            <tr>
              <th className="border border-blue-300 p-3 text-center">Session</th>
                {visibleColumns.map(col => (
                  <th key={col} className="border border-blue-300 p-3 text-center">
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
                  <tr key={session.id} className={index % 2 === 0 ? "bg-white-100" : "bg-gray-100"}>   

                    <td className="border border-blue-300 p-3 font-semibold text-center">
                      {session.sessionNum}
                    </td>

                    {grouped.map((colItems, colIndex) => (
                      <td key={colIndex} className="border border-blue-300 p-3 align-top">
                        {colItems.map(item => (
                          <div key={item.id} className="mb-1">
                            <ReadOnlyEditor value={item.label} />
                          </div>
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

// function generateSessionRowHTML(session, visibleColumns) {
//   const materials = session.materials || [];

//   const grouped = visibleColumns.map(col =>
//     materials.filter(m => m.type === col && m.active)
//   );

//   return `
//     <tr>
//       <td>${session.sessionNum}</td>

//       ${grouped.map(colItems => `
//         <td>
//           ${colItems.map(item => `<div>${item.label} ${item.body}</div>`).join("")}
//         </td>
//       `).join("")}
//     </tr>
//   `;
// }

function generateSessionRowHTML(session, visibleColumns) {
  const materials = session.materials || [];

  const grouped = visibleColumns.map(col =>
    materials.filter(m => m.type === col && m.active)
  );

  return `
    <tr>
      <td>${session.sessionNum}</td>

      ${grouped.map(colItems => `
        <td>
          ${colItems.map(item => 
              item.body
                ? `<a href="#" onclick="window.open('', '_blank').document.write('${item.body.replace(/'/g, "\\'")}'); return false;">${item.label}</a>`
                : `<span>${item.label}</span>`
            ).join("")}
        </td>
      `).join("")}
    </tr>
  `;
}

