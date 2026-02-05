import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";

export default function TeamBuilderPage() {
  const [loading, setLoading] = useState(false);

  // course selection
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  // Roster
  const [file, setFile] = useState(null);
  const [rosterCount, setRosterCount] = useState(null);

  // TeamSets
  const [teamSets, setTeamSets] = useState([]);
  const [activeSetId, setActiveSetId] = useState("");
  const [activeSet, setActiveSet] = useState(null);

  // TEMP until you wire real auth
  const createdByProfessorId = 1;

  // Load courses for the instructor dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/team-builder`, {
          credentials: 'include',
        });
        const data = await res.json();
        console.log("API response:", data, Array.isArray(data));
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        alert("Failed to load courses");
      }
    })();
  }, []);

  // When course changes, load its team sets
  useEffect(() => {
    if (!courseId) {
      setTeamSets([]);
      setActiveSetId("");
      setActiveSet(null);
      setRosterCount(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/team-builder/courses/${courseId}/teamsets`,
          {
            credentials: 'include',
          }
        );
        const sets = await res.json();
        setTeamSets(Array.isArray(sets) ? sets : []);
        if (sets?.length) {
          setActiveSetId(String(sets[0].id));
          setActiveSet(sets[0]);
        } else {
          setActiveSetId("");
          setActiveSet(null);
        }
      } catch (e) {
        console.error(e);
        alert("Failed to load team runs for course");
      }
    })();
  }, [courseId]);

  // Upload CSV (headers: email, studentId, firstName, lastName)
  const uploadRoster = async (e) => {
    e.preventDefault();
    if (!file || !courseId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `${API_BASE}/team-builder/courses/${courseId}/roster`,
        {
          method: "POST",
          body: fd,
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setRosterCount(data?.count ?? 0);
      alert(`Roster uploaded. ${data?.count ?? 0} rows imported.`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Roster upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Generate a draft TeamSet
  const generateTeams = async (e) => {
    e.preventDefault();
    if (!courseId) return;
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    const teamSize = Number(form.get("teamSize") || 4);
    if (!name) return alert("Please provide a run name");

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/team-builder/courses/${courseId}/teamsets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, teamSize, createdByProfessorId }),
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generate failed");
      // Prepend new run
      setTeamSets((prev) => (Array.isArray(prev) ? [data, ...prev] : [data]));
      setActiveSetId(String(data.id));
      setActiveSet(data);
    } catch (err) {
      console.error(err);
      alert(err.message || "Generate teams failed");
    } finally {
      setLoading(false);
    }
  };

  // Switch active TeamSet (when clicking a chip)
  const openTeamSet = async (id) => {
    setActiveSetId(String(id));
    const found = teamSets.find((t) => String(t.id) === String(id));
    if (found) return setActiveSet(found);
    // fallback re-fetch
    const res = await fetch(
      `${API_BASE}/team-builder/courses/${courseId}/teamsets`,
      {
        credentials: 'include',
      }
    );
    const sets = await res.json();
    setTeamSets(Array.isArray(sets) ? sets : []);
    setActiveSet(sets?.find((s) => String(s.id) === String(id)) || null);
  };

  // Publish
  const publishActive = async () => {
    if (!activeSet) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/team-builder/teamsets/${activeSet.id}/publish`,
        { 
          method: "PATCH",
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Publish failed");
      setActiveSet(data);
      setTeamSets((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    } catch (e) {
      console.error(e);
      alert("Publish failed");
    } finally {
      setLoading(false);
    }
  };

  // Allow editing after published
  const editActiveTeamSet = async () => {
    if (!activeSet) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/team-builder/teamsets/${activeSet.id}/edit`,
        { 
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to edit team set");
      setActiveSet(data);
      setTeamSets((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not edit");
    } finally {
      setLoading(false);
    }
  };

  // Move member to another team
  const moveMember = async (enrollmentId, toTeamId) => {
    if (!activeSet) return;
    try {
      const res = await fetch(
        `${API_BASE}/team-builder/teamsets/${activeSet.id}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentId, toTeamId }),
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Move failed");
      setActiveSet(data);
      setTeamSets((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    } catch (e) {
      console.error(e);
      alert("Move failed");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Team Builder
      </h1>

      {/* Course Picker */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Select course
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
            minWidth: 260,
          }}
        >
          <option value="">-- choose --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.id}
            </option>
          ))}
        </select>
      </div>

      {/* Roster Upload */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Roster
        </h2>
        <form
          onSubmit={uploadRoster}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button disabled={!file || !courseId || loading} style={btnStyle}>
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>
        {rosterCount != null && (
          <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
            Imported rows: {rosterCount}
          </p>
        )}
        <p style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
          CSV headers accepted: <code>email</code>, <code>studentId</code>,{" "}
          <code>firstName</code>, <code>lastName</code>
        </p>
      </div>

      {/* Generate */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Generate Teams
        </h2>
        <form
          onSubmit={generateTeams}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label style={labelStyle}>Run Name</label>
            <input
              name="name"
              placeholder="Project 1 Teams"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Team Size</label>
            <input
              name="teamSize"
              type="number"
              min={2}
              defaultValue={4}
              style={{ ...inputStyle, width: 100 }}
            />
          </div>
          <button disabled={!courseId || loading} style={btnStyle}>
            {loading ? "Working..." : "Generate"}
          </button>
        </form>
      </div>

      {/* TeamSet Chips */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Team Runs
        </h2>
        {teamSets.length ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {teamSets.map((ts) => (
              <button
                key={ts.id}
                onClick={() => openTeamSet(ts.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background:
                    String(activeSetId) === String(ts.id) ? "#eee" : "#fff",
                  cursor: "pointer",
                }}
                title={ts.status}
              >
                {ts.name} · {ts.status}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#666" }}>No runs yet.</p>
        )}
      </div>

      {/* Active TeamSet */}
      {activeSet && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>
              {activeSet.name}{" "}
              <span style={{ color: "#666", fontSize: 14 }}>
                ({activeSet.status})
              </span>
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              {activeSet.status !== "PUBLISHED" ? (
                <button onClick={publishActive} style={btnStyle}>
                  Publish
                </button>
              ) : (
                <button onClick={editActiveTeamSet} style={btnStyle}>
                  Edit Teams
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            }}
          >
            {activeSet.teams.map((team) => (
              <div
                key={team.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <h4 style={{ marginBottom: 8, fontWeight: 600 }}>
                  {team.name}
                </h4>
                <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                  {team.members.map((m) => (
                    <li
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        margin: "6px 0",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {m.enrollment?.firstName} {m.enrollment?.lastName}
                        {m.enrollment?.email ? ` — ${m.enrollment.email}` : ""}
                      </span>

                      {/* Only show move dropdown if NOT published */}
                      {activeSet.status !== "PUBLISHED" && (
                        <select
                          value={team.id}
                          onChange={(e) =>
                            moveMember(m.enrollmentId, Number(e.target.value))
                          }
                          style={{
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: 12,
                          }}
                        >
                          {activeSet.teams.map((t2) => (
                            <option key={t2.id} value={t2.id}>
                              {t2.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#555",
  marginBottom: 4,
};
const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
};
const btnStyle = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #999",
  background: "#fff",
  cursor: "pointer",
};