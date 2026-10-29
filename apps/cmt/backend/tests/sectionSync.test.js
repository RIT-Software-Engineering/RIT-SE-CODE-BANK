import assert from "node:assert/strict";
import test from "node:test";
import { compareSections, teachingWeek } from "../utils/sectionSync.js";

function section(id, status = "NOT_STARTED", overrides = {}) {
    return {
        id, section: `0${id}`, Resource: [{id: `resource-${id}`, sharedKey: "same-resource"}],
        sessions: [{id: id * 10, sharedKey: "same-session", sessionNum: 1, date: "2026-10-12", teachingWeek: 1,
            blocks: [{id, sharedKey: "same-block", name: "Workshop", status}],
            material: [{id, sharedKey: "same-material", blockId: id, active: true, type: "Class Activity",
                label: `<p><a href="/api/cmt/resources/download/resource-${id}">Worksheet</a></p>`, body: ""}],
            ...overrides}]
    };
}

test("copied sections with different row and resource IDs start in sync", () => {
    assert.deepEqual(compareSections([section(1), section(2)], "2026-10-12"), []);
});
test("completed versus incomplete blocks are out of sync and identify the affected section", () => {
    for (const status of ["NOT_STARTED", "IN_PROGRESS"]) {
        const issues = compareSections([section(1, "COMPLETED"), section(2, status)], "2026-10-12");
        assert.equal(issues.length, 1);
        assert.equal(issues[0].details.kind, "completion");
        assert.equal(issues[0].details.reviewCourseId, 2);
    }
    assert.deepEqual(compareSections([section(1, "COMPLETED"), section(2, "COMPLETED")], "2026-10-12"), []);
});
test("in-progress versus not-started is incomplete in both sections", () => {
    assert.deepEqual(compareSections([section(1), section(2, "IN_PROGRESS")], "2026-10-12"), []);
});
test("equal completion percentages do not hide different completed blocks", () => {
    const a = section(1, "COMPLETED");
    const b = section(2);
    a.sessions[0].blocks.push({sharedKey: "second", name: "Second", status: "NOT_STARTED"});
    b.sessions[0].blocks.push({sharedKey: "second", name: "Second", status: "COMPLETED"});
    assert.equal(compareSections([a, b], "2026-10-12").filter(issue => issue.details.kind === "completion").length, 2);
});
test("different meeting days and within-week moves do not change the weekly plan", () => {
    const b = section(2, "NOT_STARTED", {date: "2026-10-16", sessionNum: 3});
    assert.deepEqual(compareSections([section(1), b], "2026-10-12"), []);
});
test("moving linked work to another week creates plan differences without losing completion correspondence", () => {
    const issues = compareSections([section(1, "COMPLETED"), section(2, "NOT_STARTED", {date: "2026-10-19"})], "2026-10-12");
    assert.equal(issues.filter(issue => issue.details.kind === "plan").length, 2);
    assert.equal(issues.filter(issue => issue.details.kind === "completion").length, 1);
});
test("missing blocks/materials and edited material content are detected", () => {
    const missing = section(2, "NOT_STARTED", {blocks: [], material: []});
    assert.equal(compareSections([section(1), missing], "2026-10-12").length, 2);
    const changed = section(2);
    changed.sessions[0].material[0].body = "Different activity";
    assert.equal(compareSections([section(1), changed], "2026-10-12")[0].details.kind, "plan");
});
test("private notes and inactive materials are excluded", () => {
    const a = section(1);
    a.sessions[0].material.push({sharedKey: "note", active: true, type: "Personal Notes"}, {sharedKey: "removed", active: false, type: "Class Activity"});
    assert.deepEqual(compareSections([a, section(2)], "2026-10-12"), []);
});
test("canceled unfinished work raises a warning; restoration or moving work clears it", () => {
    const a = section(1, "NOT_STARTED", {canceled: true});
    assert.equal(compareSections([a, section(2)], "2026-10-12")[0].details.kind, "cancellation");
    a.sessions[0].canceled = false;
    assert.deepEqual(compareSections([a, section(2)], "2026-10-12"), []);
    a.sessions.push({...a.sessions[0], id: 99, canceled: true, blocks: [], material: []});
    assert.deepEqual(compareSections([a, section(2)], "2026-10-12"), []);
});
test("one section has nothing to compare and undated sessions use their planned week", () => {
    assert.deepEqual(compareSections([section(1, "COMPLETED")]), []);
    assert.equal(teachingWeek({date: null, teachingWeek: 2}, null), 2);
    assert.equal(teachingWeek({date: "2026-11-02"}, "2026-10-14"), 4);
});
