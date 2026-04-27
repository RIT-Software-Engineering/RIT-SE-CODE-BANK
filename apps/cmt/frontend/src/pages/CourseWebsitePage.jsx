import { useEffect, useMemo, useState } from "react";
import { ReadOnlyEditor } from "../components/RichTextEditor/RichTextEditor.jsx";
import { CMTJsonFetch } from "../utils/api.js";
import { createErrorHandler } from "../utils/error.jsx";

export default function CourseWebsitePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch courses
  useEffect(() => 
    void CMTJsonFetch("GET", `course`)
      .then(setCourses)
      .catch(createErrorHandler("Failed to fetch courses.")),
    []
  )

  // Fetch sessions and materials for selected course
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchSessions = async () => {
      setLoading(true);
      await CMTJsonFetch("GET", `session/${selectedCourse}`).then(async json => {
        const combined = json.sessions.map((session, index) => ({
          ...session,
          materials: json.sessionMaterials[index]?.material || [],
        }));
        setSessions(combined);
      })
        .catch(createErrorHandler("Failed to fetch sessions for course.", () => setSessions([])))
        .finally(() => setLoading(false));
    };

    fetchSessions();
  }, [selectedCourse]);

  // the full course object to get course name & course id
  const selectedCourseObj = useMemo(() => {
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

