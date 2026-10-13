import { useEffect, useMemo, useState } from "react";
import { ReadOnlyEditor } from "../components/RichTextEditor/RichTextEditor.jsx";
import { CMTJsonFetch, CMTJsonFetchRaw } from "../utils/api.js";
import { createErrorHandler } from "../utils/error.jsx";
import JSZip from "jszip";
import { Alert, Form } from "react-bootstrap";
import { CMTError } from "@se-code-bank/cmt-shared-utilities";
import logo from "../images/se_logo_new.png";

export default function CourseWebsitePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isWeeks, setIsWeeks] = useState(false);

  // Fetch courses
  useEffect(() => 
    void CMTJsonFetch("GET", `course?isActive=true`)
      .then(setCourses)
      .catch(createErrorHandler("Failed to fetch courses.")),
    []
  )

  // the full course object to get course name & course id
  const selectedCourseObj = useMemo(() => {
    console.log("selectedCourse:", selectedCourse);
    console.log("courses:", courses);
    return courses.find(c => c.id === selectedCourse) || null;
  }, [selectedCourse, courses]);

    // Fetch sessions and materials for selected course
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchSessions = async () => {
      setLoading(true);
      await CMTJsonFetch("GET", `session/${selectedCourse}`).then(async json => {
        const combined = json.sessions.map((session, index) => ({
          ...session,
          materials: json.sessionMaterials[index]?.material || [],
          blocks: json.sessionBlocks?.[index]?.blocks || [],
        })).sort((a, b) => a.sessionNum - b.sessionNum);
        setSessions(combined);

        // AI-generated code
        if (courses.find(c => c.id === selectedCourse)?.days)
          setWeeks(combined.reduce((acc, item, index) => {
            const group = Math.floor(index / courses.find(c => c.id === selectedCourse)?.days?.split(", ")?.length);
            if (!acc[group]) acc[group] = [];
            acc[group].push(item);
            return acc;
          }, []));
        else
          setWeeks(null);

      }).catch(async error => {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      }).finally(() => setLoading(false));
    };

    fetchSessions();
  }, [selectedCourse, courses]);

  const generateCourseHTML = async (course, sessions, weeks, isWeeks, syllabusName) => {
    const showBlockColumn = sessions.some(session => (session.blocks || []).length > 0);
    let rows;
    if (isWeeks && weeks)
      rows = await Promise.all(
        weeks
          .map((week, index) =>
            generateWeekRowHTML(week, visibleColumns, index, showBlockColumn)
          )
      );
    else
      rows = await Promise.all(
        sessions
          .sort((a, b) => a.sessionNum - b.sessionNum)
          .map(session =>
            generateSessionRowHTML(session, visibleColumns, showBlockColumn)
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

        header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 0;
        }

        h1 {
            color: #0484c9;
            text-align: left;
            font-size: 1.4em;
        }

        h2 a {
            color: #0484c9;
            text-align: left;
            font-size: 1.2em;
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
        }

        td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          vertical-align: top;
        }

        tr:nth-child(even) {
          background-color: #f3f4f6;
        }

        tr.canceled {
          background-color: #fef2f2;
          color: #991b1b;
        }

        .canceled-label {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <header class="header">
        <a href="https://www.se.rit.edu">
          <img alt="Software Engineering Department" src="../resources/se_logo_new.png">
        </a>

        <h1>
          ${course.classId}<br>${course.name}
        </h1>
      </header>

      <h2> <a href="../${syllabusName}">Syllabus</a> </h2>

      <table>
        <thead>
          <tr>
            <th>${isWeeks ? 'Week' : 'Session'}</th>
            ${showBlockColumn ? '<th>Block</th>' : ''}
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

    const syllabusArray = await CMTJsonFetch("GET", `/resources/syllabus/${selectedCourseObj.id}`).catch(createErrorHandler("Error getting syllabus ID"))

    const syllabus = syllabusArray[0];

    const syll = await CMTJsonFetchRaw("GET", `/resources/download/${syllabus.id}`).catch(createErrorHandler("Error getting syllabus"))

    const blob1 = await syll.blob();

    const syllabusFolder = zip.folder("public_html")

    const syllabusName = sanitize(syllabus.filename)

    syllabusFolder.file(syllabusName, blob1)

    const resources = await CMTJsonFetch("GET", `/resources/${selectedCourseObj.id}`).catch(createErrorHandler("Error getting resources"));


    const resourcesFolder = zip.folder("public_html/resources");

    const resp = await fetch(logo);
    const blob = await resp.blob();

    resourcesFolder.file("se_logo_new.png", blob);

    await Promise.all(resources.map(async (resource) => {
      try {
        const resp = await CMTJsonFetchRaw("GET", `/resources/download/${resource.id}`).catch(createErrorHandler(`Failed to fetch resource ${resource.id}`));

        const blob = await resp.blob();
        const fileName = sanitize(resource.filename);
        resourcesFolder.file(fileName, blob);

      } catch (err) {
        throw new CMTError({ userFacingMessage: `Failed resource ${resource} ${err}`, cause: err })
      }
    }));

    // Generate Index HTML
    const html = await generateCourseHTML(selectedCourseObj, sessions, weeks, isWeeks, syllabusName);

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

    await CMTJsonFetch("PUT", `/workflow/editDownloadCourseAction`, {workflowId: selectedCourseObj.workflowId}).catch(createErrorHandler("Error downloading course."))
  };

  const visibleColumns = MATERIAL_COLUMNS.filter(col =>
    sessions.some(session =>
      (session.materials || []).some(m => m.type === col && m.active)
    )
  );
  const showBlockColumn = sessions.some(session => (session.blocks || []).length > 0);

  return (
    <div>
      {/* Course Selector */}
      <div>
        <Form.Select
          className="border rounded-lg p-2 text-lg max-w-[30%]"
          value={selectedCourse || ""}
          onChange={(e) => setSelectedCourse(Number(e.target.value))}>
          <option value="" disabled>Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.classId}-{course.section} | {course.name} ({course.season} {course.year})
            </option>
          ))}
        </Form.Select>
      </div>
      <div className="flex text-lg gap-2 mt-3">
        <Form.Label className={`${selectedCourse ? '' : 'text-gray-300'}`}>Display as weeks?</Form.Label>
        <Form.Check disabled={!selectedCourse} onChange={() => setIsWeeks(prev => !prev)}/>
      </div>

      {selectedCourse && (
        // AI-generated
        <div className="text-center">
          <button
            onClick={downloadCourseZIP}
            className={`${(isWeeks && weeks) || !isWeeks ? 'block' : 'hidden'} group mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-150 cursor-pointer`}
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
        <div className="text-center p-6">Loading material...</div>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 text-center">No material found for this course.</p>
      ) : (
        <table className="mx-auto w-full border-collapse">
          <thead className="[&>tr>th]:text-white [&>tr>th]:font-bold [&>tr>th]:bg-[#0484c9]">
            <tr>
              <th className="border border-blue-300 p-3 text-center">{isWeeks ? 'Week' : 'Session'}</th>
                {showBlockColumn && (
                  <th className="border border-blue-300 p-3 text-center">Block</th>
                )}
                {visibleColumns.map(col => (
                  <th key={col} className="border border-blue-300 p-3 text-center">
                    {col}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {!isWeeks ? sessions
              .map((session, index) => {
                const scheduleRows = getSessionScheduleRows(session);
                const rowClass = session.canceled ? "bg-red-50 text-red-800" : index % 2 === 0 ? "bg-white-100" : "bg-gray-100";
                return scheduleRows.map((scheduleRow, rowIndex) => (
                  <tr key={scheduleRow.key} className={rowClass}>
                    {rowIndex === 0 && (
                      <td rowSpan={scheduleRows.length} className="border border-blue-300 p-3 text-center">
                        <p className="font-semibold">{session.sessionNum}</p>
                        <p>{session?.date ?? "TBD"}</p>
                        {session.canceled && <p className="font-semibold">Canceled - No class</p>}
                      </td>
                    )}

                    {showBlockColumn && (
                      <td className="border border-blue-300 p-3 align-top font-semibold">
                        {scheduleRow.name || "Unassigned"}
                      </td>
                    )}

                    {visibleColumns.map(col => (
                      <td key={col} className="border border-blue-300 p-3 align-top">
                        {scheduleRow.materials.filter(item => item.type === col).map(item => (
                          <div key={item.id} className="mb-1">
                            <ReadOnlyEditor value={item.label} />
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                ));
              }) : 

              (weeks? weeks.map((week, index) => {
                const scheduleRows = week.flatMap(session =>
                  getSessionScheduleRows(session).map(row => ({
                    ...row,
                    name: `Session ${session.sessionNum}: ${row.name || "Unassigned"}`
                  }))
                );
                const canceledSessions = week.filter(session => session?.canceled);

                return scheduleRows.map((scheduleRow, rowIndex) => (
                  <tr key={`week-${index}-${scheduleRow.key}`} className={index % 2 === 0 ? "bg-white-100" : "bg-gray-100"}>
                    {rowIndex === 0 && (
                      <td rowSpan={scheduleRows.length} className="border border-blue-300 p-3 text-center">
                        <p className="font-semibold">{index+1}</p>
                        <small>
                          <span>{week[0]?.date ?? "TBD"} -</span>
                          <p>{week[week.length-1]?.date ?? "TBD"}</p>
                        </small>
                        {canceledSessions.map(session =>
                          <p key={session.id} className="font-semibold text-red-800">
                            Session {session.sessionNum}: Canceled - No class
                          </p>
                        )}
                      </td>
                    )}

                    {showBlockColumn && (
                      <td className="border border-blue-300 p-3 align-top font-semibold">
                        {scheduleRow.name}
                      </td>
                    )}

                    {visibleColumns.map(col => (
                        <td key={col} className="border border-blue-300 p-3 align-top">
                          {scheduleRow.materials.filter(item => item.type === col).map(item => (
                          <div key={item.id} className="mb-1">
                            <ReadOnlyEditor value={item.label} />
                          </div>
                        ))}
                        </td>
                    ))}
                  </tr>
                ));
              }) :
              <Alert variant="danger">
                <p>You have not selected days in your course, so we cannot display the site in weeks.</p>
                <p>If you would like to see your course in weeks, please finish the first multi-step to continue.</p>
              </Alert>
            )

            }
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

function getSessionScheduleRows(session) {
  const materials = (session.materials || []).filter(material => material.active);
  const blocks = [...(session.blocks || [])].sort((a, b) => a.position - b.position || a.id - b.id);

  if (blocks.length === 0) {
    return [{key: `session-${session.id}`, name: null, materials}];
  }

  const blockIds = new Set(blocks.map(block => block.id));
  const rows = blocks.map(block => ({
    key: `block-${block.id}`,
    name: block.name,
    materials: materials.filter(material => material.blockId === block.id)
  }));
  const unassignedMaterials = materials.filter(material => !blockIds.has(material.blockId));

  if (unassignedMaterials.length > 0) {
    rows.push({
      key: `session-${session.id}-unassigned`,
      name: "Unassigned",
      materials: unassignedMaterials
    });
  }

  return rows;
}

// Generates the sessions rows for the downloaded site
async function generateSessionRowHTML(session, visibleColumns, showBlockColumn) {
  const scheduleRows = getSessionScheduleRows(session);
  const rowsHTML = await Promise.all(scheduleRows.map(async (scheduleRow, rowIndex) => {
    const columnsHTML = await generateMaterialColumnsHTML(scheduleRow.materials, visibleColumns);
    const sessionCell = rowIndex === 0 ? `
      <td rowspan="${scheduleRows.length}">
        <p><strong>${session.sessionNum}</strong></p>
        <p>${session?.date ?? "TBD"}</p>
        ${session.canceled ? '<p class="canceled-label">Canceled - No class</p>' : ''}
      </td>` : "";
    const blockCell = showBlockColumn
      ? `<td><strong>${escapeHTML(scheduleRow.name || "Unassigned")}</strong></td>`
      : "";

    return `
      <tr${session.canceled ? ' class="canceled"' : ''}>
        ${sessionCell}
        ${blockCell}
        ${columnsHTML}
      </tr>
    `;
  }));

  return rowsHTML.join("");
}

async function generateWeekRowHTML(week, visibleColumns, weekIndex, showBlockColumn) {
  const scheduleRows = week.flatMap(session =>
    getSessionScheduleRows(session).map(row => ({
      ...row,
      name: `Session ${session.sessionNum}: ${row.name || "Unassigned"}`
    }))
  );
  const canceledSessions = week.filter(session => session?.canceled);
  const rowsHTML = await Promise.all(scheduleRows.map(async (scheduleRow, rowIndex) => {
    const columnsHTML = await generateMaterialColumnsHTML(scheduleRow.materials, visibleColumns);
    const weekCell = rowIndex === 0 ? `
      <td rowspan="${scheduleRows.length}">
        <p><strong>${weekIndex+1}</strong></p>
        <small>
          <span>${week[0]?.date ?? "TBD"} - </span>
          <p>${week[week.length-1]?.date ?? "TBD"}</p>
        </small>
        ${canceledSessions.map(session =>
          `<p class="canceled-label">Session ${session.sessionNum}: Canceled - No class</p>`
        ).join("")}
      </td>` : "";
    const blockCell = showBlockColumn
      ? `<td><strong>${escapeHTML(scheduleRow.name)}</strong></td>`
      : "";

    return `
      <tr>
        ${weekCell}
        ${blockCell}
        ${columnsHTML}
      </tr>
    `;
  }));

  return rowsHTML.join("");
}

async function generateMaterialColumnsHTML(materials, visibleColumns) {
  const columnsHTML = await Promise.all(visibleColumns.map(async col => {
    const itemsHTML = await Promise.all(
      materials.filter(item => item.type === col).map(generateMaterialHTML)
    );
    return `<td>${itemsHTML.join("")}</td>`;
  }));

  return columnsHTML.join("");
}

async function generateMaterialHTML(item) {
  // Material bodies open on a separate overlay in the generated website.
  if (item.body) {
    const rewrittenBody = await rewriteResourceLinks(item.body);
    const fullHtml = `<!DOCTYPE html><html><body>${rewrittenBody}</body></html>`;
    const encoded = btoa(unescape(encodeURIComponent(fullHtml)));

    return `<a href="#" onclick="openItem('${encoded}'); return false;">
      ${item.label}
    </a>`;
  }

  const rewrittenLabel = await rewriteResourceLinks(item.label);

  if (rewrittenLabel === item.label && ![...item.label.matchAll(/href="([^"]*)"/g)].length) {
    return `<span>${item.label}</span>`;
  }

  return `<span>${rewrittenLabel}</span>`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      const resource = await CMTJsonFetch("GET", `/resources/id/${id}`);

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
