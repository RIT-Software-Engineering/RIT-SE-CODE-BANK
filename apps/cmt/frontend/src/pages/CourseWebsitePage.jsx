import { useEffect, useMemo, useState } from "react";
import { CMTJsonFetch } from "../utils/api.js";
import { ReadOnlyEditor } from "../components/RichTextEditor/RichTextEditor.jsx";
import JSZip from "jszip";

export default function CourseWebsitePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch courses
  useEffect(() => {
    (async () => {
      await CMTJsonFetch("GET", `course`).then(async response => {
          const result = await response.json();
          setCourses(result);
      }).catch(async error => {
        console.error(error);
      });
    })();
  }, []);

  // Fetch sessions and materials for selected course
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchSessions = async () => {
      setLoading(true);
      await CMTJsonFetch("GET", `session/${selectedCourse}`).then(async response => {
        const result = await response.json();
        const combined = result.sessions.map((session, index) => ({
          ...session,
          materials: result.sessionMaterials[index]?.material || [],
        }));
        setSessions(combined);
      }).catch(async error => {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      }).finally(() => setLoading(false));
    };

    fetchSessions();
  }, [selectedCourse]);

  // the full course object to get course name & course id
  const selectedCourseObj = useMemo(() => {
    console.log("selectedCourse:", selectedCourse);
    console.log("courses:", courses);
    return courses.find(c => c.id === selectedCourse) || null;
  }, [selectedCourse, courses]);

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

  const downloadCourseZIP = async () => {
    if (!selectedCourseObj) return;

    const zip = new JSZip();

    const sanitize = (name) => name.replace(/[^a-z0-9.\-_]/gi, "_");

    const response = await CMTFetch("GET", `/resources/${selectedCourseObj.id}`);
    if (!response.ok) throw new Error("Failed to fetch resources");
    const resources = await response.json();
    console.log("Resources for course:", resources);

    const resourcesFolder = zip.folder("public_html/resources");

    await Promise.all(resources.map(async (resource) => {
      try {
        const resp = await CMTFetch("GET", `/resources/download/${resource.id}`);
        if (!resp.ok) throw new Error(`Failed to fetch resource ${resource.id}`);

        const blob = await resp.blob();
        const fileName = sanitize(resource.filename);
        resourcesFolder.file(fileName, blob);

      } catch (err) {
        console.error("Failed resource:", resource, err);
      }
    }));

    // Generate Index HTML
    const html = generateCourseHTML(selectedCourseObj, sessions);

    // Add HTML file to course folder
    zip.file(`public_html/${selectedCourseObj.classId}-${selectedCourseObj.section}-course-website.html`, html);
    zip.file(`README.txt`, `This ZIP contains the course website for ${selectedCourseObj.classId}-${selectedCourseObj.section} | ${selectedCourseObj.name}\n\nOpen the HTML file in the "public_html" folder to view the course website. All resources are located in the "resources" folder.`);

    // Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(content);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${selectedCourseObj.classId}-${selectedCourseObj.section}.zip`;

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
      <div className = "text-center">
        <button
          onClick={downloadCourseZIP}
          className="mt-6 px-4 py-2 text-black rounded">
          Download Course Website (ZIP)
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
          ${colItems.map(item => {
            if (item.body) {
              const safeBody = item.body
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'")
                .replace(/\n/g, "\\n");
              
              return `<a href="#"
                         onclick="const w=window.open(); w.document.write('${safeBody}'); w.document.close(); return false;">
                        ${item.label}
                      </a>`;
            } else {
              return `<span>${item.label}</span>`;
            }
          }).join("")}
        </td>
      `).join("")}
    </tr>
  `;
}

