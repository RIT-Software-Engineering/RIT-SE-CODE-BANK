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

  const  generateCourseHTML = async (course, sessions) => {
    const rows = await Promise.all(
      sessions
        .sort((a, b) => a.sessionNum - b.sessionNum)
        .map(session =>
          generateSessionRowHTML(session, visibleColumns)
        )
    );

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
          ${rows.join("")}
        </tbody>
      </table>

    <script>
      function openItem(encoded) {
        const html = decodeURIComponent(escape(atob(encoded)));
        
        const overlay = document.createElement('div');
        overlay.id = 'item-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999;border:none;';
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width:100%;height:100%;border:none;';
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();

        history.pushState({ isItem: true }, '', '#item');

        window.addEventListener('popstate', function handler(e) {
          const el = document.getElementById('item-overlay');
          if (el) el.remove();
          window.removeEventListener('popstate', handler);
        });
      }
    </script>

    </body>
    </html>
    `;
  };

  const downloadCourseZIP = async () => {
    if (!selectedCourseObj) return;

    const zip = new JSZip();

    const sanitize = (name) => name.replace(/[^a-z0-9.\-_]/gi, "_");

    const response = await CMTJsonFetch("GET", `/resources/${selectedCourseObj.id}`);

    if (!response.ok) throw new Error("Failed to fetch resources");

    const resources = await response.json();

    console.log("Resources for course:", resources);

    const resourcesFolder = zip.folder("public_html/resources");

    await Promise.all(resources.map(async (resource) => {
      try {
        const resp = await CMTJsonFetch("GET", `/resources/download/${resource.id}`);
        if (!resp.ok) throw new Error(`Failed to fetch resource ${resource.id}`);

        const blob = await resp.blob();
        const fileName = sanitize(resource.filename);
        resourcesFolder.file(fileName, blob);

      } catch (err) {
        console.error("Failed resource:", resource, err);
      }
    }));

    // Generate Index HTML
    const html = await generateCourseHTML(selectedCourseObj, sessions);

    // Add HTML file to course folder
    // Added to hard coded 00 folder for now. Change in future for specific course section.
    zip.file(`public_html/00/${selectedCourseObj.classId}-${selectedCourseObj.section}-course-website.html`, html);
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

      {selectedCourse && (
        <div className="text-center">
          <button
            onClick={downloadCourseZIP}
            className="group mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-150 cursor-pointer"
          >
            <svg
              className="w-4 h-4 transition-transform duration-150 group-hover:translate-y-0.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Course Website (ZIP)
          </button>
        </div>
      )}

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

// Generates the sessions rows for the downloaded site
async function generateSessionRowHTML(session, visibleColumns) {
  const materials = session.materials || [];

  const grouped = visibleColumns.map(col =>
    materials.filter(m => m.type === col && m.active)
  );

  const columnsHTML = await Promise.all(
    grouped.map(async colItems => {
      const itemsHTML = await Promise.all(
        colItems.map(async item => {
          // If an item has a body rewrite any resource links in the body and encoded it.
          // Then whenever the title is clicked open a new page with the body content
          if (item.body) {
            const rewrittenBody = await rewriteResourceLinks(item.body);
            const fullHtml = `<!DOCTYPE html><html><body>${rewrittenBody}</body></html>`;
            const encoded = btoa(unescape(encodeURIComponent(fullHtml)));

            return `<a href="#" onclick="openItem('${encoded}'); return false;">
              ${item.label}
            </a>`;
          }

          // Rewrite resource links in title
          const rewrittenLabel = await rewriteResourceLinks(item.label);

          if (rewrittenLabel === item.label && ![...item.label.matchAll(/href="([^"]*)"/g)].length) {
            return `<span>${item.label}</span>`;
          }

          return `<span>${rewrittenLabel}</span>`;
        })
      );

      return `<td>${itemsHTML.join("")}</td>`;
    })
  );

  return `
    <tr>
      <td>${session.sessionNum}</td>
      ${columnsHTML.join("")}
    </tr>
  `;
}


// Helper function to rewrite the resource links from api calls to relatives paths
async function rewriteResourceLinks(html) {
  const hrefRegex = /href="([^"]*)"/g;
  const matches = [...html.matchAll(hrefRegex)];

  if (matches.length === 0) return html;

  let updated = html;

  for (const match of matches) {
    const href = match[1];
    const id = href.split('/').filter(Boolean).pop();

    try {
      const response = await CMTJsonFetch("GET", `/resources/id/${id}`);
      const resource = await response.json();

      if (!resource || !resource.filename) continue;

      const sanitize = (name) => name.replace(/[^a-z0-9.\-_]/gi, "_");
      const filename = sanitize(resource.filename);

      updated = updated.replace(`href="${href}"`, `href="../resources/${filename}"`);
    } catch (err) {
      console.error("Failed to fetch resource:", err);
    }
  }

  return updated;
}