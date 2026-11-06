import assert from "node:assert/strict";
import test from "node:test";
import { isStudentUser, namesConflict, normalizeStudentEmail, prepareStudentRoster, studentName } from "../utils/students.js";
import requireInstructor from "../middleware/requireInstructor.js";

test("student email is normalized and restricted to configured institutional domains", () => {
    assert.equal(normalizeStudentEmail("  Student@RIT.EDU "), "student@rit.edu");
    for (const value of [null, "", "missing", "a@rit.edu@example.com", "a@gmail.com", "a@notrit.edu", "a@rit.edu.evil.test", ".a@rit.edu", "a..b@rit.edu"])
        assert.throws(() => normalizeStudentEmail(value));
});
test("roster import requires email and discards university IDs and extra fields", () => {
    const entries = prepareStudentRoster([{email: "Student@rit.edu", firstName: " Student ", lastName: "One", studentId: "DO-NOT-STORE", major: "DO-NOT-STORE"}]);
    assert.deepEqual(entries, [{email: "student@rit.edu", fname: "Student", lname: "One"}]);
    assert.throws(() => prepareStudentRoster([{studentId: "DO-NOT-STORE"}]), /CSV row 2/);
});
test("duplicate roster rows are collapsed, conflicting identities produce row-number errors", () => {
    assert.equal(prepareStudentRoster([{email: "a@rit.edu", firstName: "Ada"}, {email: "A@rit.edu", lastName: "Example"}]).length, 1);
    assert.throws(() => prepareStudentRoster([{email: "a@rit.edu", firstName: "Ada"}, {email: "a@rit.edu", firstName: "Other"}]), /CSV row 3/);
    assert.equal(namesConflict({fname: "Ada  Example"}, {fname: "ada example"}), false);
    assert.equal(namesConflict({fname: "Ada"}, {fname: "Other"}), true);
});
test("missing names remain optional and unsupported personal fields are unnecessary", () => {
    assert.equal(studentName(undefined), null);
    assert.throws(() => studentName("x".repeat(192)));
    assert.throws(() => studentName({name: "invalid"}));
    assert.deepEqual(prepareStudentRoster([{email: "a@rit.edu"}]), [{email: "a@rit.edu", fname: null, lname: null}]);
});
test("student and TA identities share profile eligibility; neither grants instructor access", () => {
    for (const role of ["student", "ta"]) {
        assert.equal(isStudentUser({roles: [role]}), true);
        const response = {status(code) {this.code = code; return this;}, json(body) {this.body = body;}};
        let next = false;
        requireInstructor({user: {roles: [role]}}, response, () => {next = true;});
        assert.equal(response.code, 403);
        assert.equal(next, false);
    }
    assert.equal(isStudentUser({roles: ["instructor"]}), false);
    let passed = false;
    requireInstructor({user: {roles: ["instructor"]}}, {}, () => {passed = true;});
    assert.equal(passed, true);
    const response = {status(code) {this.code = code; return this;}, json() {}};
    requireInstructor({user: null}, response, () => assert.fail("Unauthenticated request passed"));
    assert.equal(response.code, 401);
});
