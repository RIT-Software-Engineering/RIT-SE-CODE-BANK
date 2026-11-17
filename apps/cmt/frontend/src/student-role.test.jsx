import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext, AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RoleHome from "./components/RoleHome.jsx";
import SiteNav from "./components/SiteNav.jsx";
import StudentCoursesPage from "./pages/student/StudentCoursesPage.jsx";
import StudentTeamsPage from "./pages/student/StudentTeamsPage.jsx";
import TeachingSectionsPage from "./pages/teaching/TeachingSectionsPage.jsx";
import TeachingSectionPage from "./pages/teaching/TeachingSectionPage.jsx";
import TeachingStaff from "./pages/course/TeachingStaff.jsx";
import { CMTJsonFetch } from "./utils/api.js";
import { hasAnyRole, homeForUser, INSTRUCTOR_ROLES } from "./utils/roles.js";

jest.mock("./utils/api.js", () => ({API_BASE: "/api/cmt", CMTJsonFetch: jest.fn()}));
jest.mock("./components/RichTextEditor/RichTextEditor", () => ({ReadOnlyEditor: function MockReadOnly({value}) {return <div>{value}</div>;}}));
jest.mock("./utils/auth.js", () => ({logout: jest.fn()}));
jest.mock("./utils/LoginWrapper.js", () => function MockLogin() {return <div>Sign in required</div>;});

const student = {name: "Student One", email: "student@rit.edu", roles: ["student"], studentProfileId: "student-one", expiresInMs: null};
const courseA = {id: 1, name: "Software Engineering", classId: "SWEN-101", section: "01", season: "Fall", year: 2026};
const courseB = {...courseA, id: 2, classId: "SWEN-202", section: "02"};
const response = (body, status = 200) => ({ok: status >= 200 && status < 300, status, json: async () => body});
const session = user => ({user, status: "authenticated", refresh: jest.fn(), signOut: jest.fn()});
function mount(children, {user = student, path = "/", auth} = {}) {
    return render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={auth || session(user)}>
        {children}
    </AuthContext.Provider></MemoryRouter>);
}

beforeEach(() => {global.fetch = jest.fn(); CMTJsonFetch.mockReset();});
afterEach(() => {jest.useRealTimers(); jest.restoreAllMocks();});

test("home and role helpers deny missing roles and preserve dual-role instructor home", () => {
    expect(homeForUser(student)).toBe("/student/courses");
    expect(homeForUser({...student, roles: ["ta"]})).toBe("/student/courses");
    expect(homeForUser({...student, roles: ["student", "instructor"]})).toBe("/");
    expect(homeForUser({roles: ["unknown"]})).toBeNull();
    expect(hasAnyRole({roles: "instructor"}, INSTRUCTOR_ROLES)).toBe(false);
});

test("section assignments provide teaching navigation alongside student enrollments", async () => {
    const ta = {...student, hasTeachingAccess: true};
    expect(homeForUser(ta)).toBe("/teaching");
    mount(<SiteNav />, {user: ta});
    expect(screen.getByText("Teaching")).toBeInTheDocument();
    expect(screen.getByText("My Learning")).toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
});

test("teaching assignments link TAs to their limited section and instructors to course editing", async () => {
    fetch.mockResolvedValue(response({sections: [
        {...courseA, role: "TA", capabilities: {editMaterials: false}},
        {...courseB, role: "Instructor", capabilities: {editMaterials: true}}
    ]}));
    mount(<TeachingSectionsPage />, {user: {...student, hasTeachingAccess: true}});
    const links = await screen.findAllByRole("link", {name: "Open section"});
    expect(links[0]).toHaveAttribute("href", "/teaching/1");
    expect(links[1]).toHaveAttribute("href", "/courses/2");
});

test("a TA teaching assignment cannot mount the instructor course editor", async () => {
    mount(<Routes>
        <Route path="/courses/1" element={<RequireAuth teachingInstructor><div>Section editor</div></RequireAuth>} />
        <Route path="/teaching" element={<div>Teaching destination</div>} />
    </Routes>, {path: "/courses/1", user: {...student, hasTeachingAccess: true, hasInstructorAccess: false}});
    expect(await screen.findByText("Teaching destination")).toBeInTheDocument();
    expect(screen.queryByText("Section editor")).not.toBeInTheDocument();
});

test("TA section progress uses its scoped endpoint and consistent status colors", async () => {
    const detail = {course: courseA, role: "TA", capabilities: {updateProgress: true}, sessions: [
        {id: 10, sessionNum: 1, canceled: true, material: [], blocks: [{id: 100, name: "Lecture", status: "COMPLETED"}]}
    ]};
    fetch.mockResolvedValue(response(detail));
    CMTJsonFetch.mockResolvedValue({block: {id: 100}});
    mount(<Routes><Route path="/teaching/:id" element={<TeachingSectionPage />} /></Routes>,
        {path: "/teaching/1", user: {...student, hasTeachingAccess: true}});
    fireEvent.click(await screen.findByRole("button", {name: /Session 1/}));
    const select = screen.getByLabelText("Lecture status");
    expect(select).toHaveClass("bg-success", "text-white");
    for (const option of select.options) expect(option).toHaveClass("bg-secondary", "text-white");
    fireEvent.change(select, {target: {value: "IN_PROGRESS"}});
    await waitFor(() => expect(CMTJsonFetch).toHaveBeenCalledWith("PATCH", "/teaching/sections/1/blocks/100/status", {status: "IN_PROGRESS"}));
    expect(screen.queryByText("Cancel session")).not.toBeInTheDocument();
});

test("staff management is available to the section owner", async () => {
    const course = {...courseA, capabilities: {manageStaff: false}};
    const view = mount(<TeachingStaff course={course} />);
    expect(screen.queryByRole("button", {name: "Teaching staff"})).not.toBeInTheDocument();
    CMTJsonFetch.mockResolvedValue({staff: [{role: "OWNER", profile: {id: "owner", email: "owner@rit.edu"}}]});
    view.unmount();
    mount(<TeachingStaff course={{...course, capabilities: {manageStaff: true}}} />);
    fireEvent.click(screen.getByRole("button", {name: "Teaching staff"}));
    expect(await screen.findByText("owner@rit.edu")).toBeInTheDocument();
    expect(screen.queryByRole("button", {name: /Remove owner/})).not.toBeInTheDocument();
});

test("student-only accounts cannot mount instructor children or loop on redirect", async () => {
    mount(<Routes>
        <Route path="/courses" element={<RequireAuth roles={INSTRUCTOR_ROLES}><div>Private instructor view</div></RequireAuth>} />
        <Route path="/student/courses" element={<div>Student destination</div>} />
    </Routes>, {path: "/courses"});
    expect(await screen.findByText("Student destination")).toBeInTheDocument();
    expect(screen.queryByText("Private instructor view")).not.toBeInTheDocument();
});

test("instructor children remain accessible for an explicit instructor role", () => {
    mount(<RequireAuth roles={INSTRUCTOR_ROLES}><div>Instructor content</div></RequireAuth>, {user: {...student, roles: ["instructor"]}});
    expect(screen.getByText("Instructor content")).toBeInTheDocument();
});

test("student home redirects while instructor home stays unchanged", () => {
    mount(<Routes><Route path="/" element={<RoleHome />} /><Route path="/student/courses" element={<div>My enrolled courses</div>} /></Routes>);
    expect(screen.getByText("My enrolled courses")).toBeInTheDocument();
});

test("student navigation contains learner links but no authoring menus", async () => {
    mount(<SiteNav />);
    expect(screen.queryByText("Course Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("My Learning"));
    expect(await screen.findByText("My Courses")).toBeInTheDocument();
    expect(screen.getByText("My Teams")).toBeInTheDocument();
});

test("dual-role navigation keeps authoring menus and adds learner access", () => {
    mount(<SiteNav />, {user: {...student, roles: ["instructor", "student"]}});
    expect(screen.getByText("Course Management")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("My Learning")).toBeInTheDocument();
});

test("course summaries use self-service data and link only to the student's team view", async () => {
    fetch.mockResolvedValue(response({enrollments: [{id: 10, course: courseA}]}));
    mount(<StudentCoursesPage />);
    expect(await screen.findByText("Software Engineering")).toBeInTheDocument();
    expect(screen.getByText("Section: 01")).toBeInTheDocument();
    expect(screen.getByRole("link", {name: /View teams/})).toHaveAttribute("href", "/student/teams?courseId=1");
    expect(fetch).toHaveBeenCalledWith("/api/cmt/students/me/courses", expect.objectContaining({credentials: "include", cache: "no-store"}));
});

test("empty enrollment state is explicit", async () => {
    fetch.mockResolvedValue(response({enrollments: []}));
    mount(<StudentCoursesPage />);
    expect(await screen.findByText("No active course enrollments.")).toBeInTheDocument();
});

test("failed student requests can be retried without showing internal errors", async () => {
    fetch.mockRejectedValueOnce(new Error("private database details")).mockResolvedValue(response({enrollments: [{id: 10, course: courseA}]}));
    mount(<StudentCoursesPage />);
    expect(await screen.findByText("Unable to load my courses.")).toBeInTheDocument();
    expect(screen.queryByText("private database details")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: "Retry"}));
    expect(await screen.findByText("Software Engineering")).toBeInTheDocument();
});

test("team view filters by enrolled section and rejects mismatched/outside memberships", async () => {
    const membership = (id, courseId, name, teamCourse = courseId) => ({id, role: "Member", enrollment: {courseId}, tbteam: {name, teamSet: {name: "Project", courseId: teamCourse}}});
    fetch.mockImplementation(url => Promise.resolve(url.endsWith("/courses") ? response({enrollments: [{id: 10, course: courseA}, {id: 20, course: courseB}]}) : response({memberships: [
        membership(1, 1, "My first team"), membership(2, 2, "My second team"), membership(3, 99, "Outside team"), membership(4, 1, "Mismatched team", 2)
    ]})));
    mount(<StudentTeamsPage />, {path: "/student/teams?courseId=1"});
    expect(await screen.findByText("My first team")).toBeInTheDocument();
    expect(screen.queryByText("My second team")).not.toBeInTheDocument();
    expect(screen.queryByText("Outside team")).not.toBeInTheDocument();
    expect(screen.queryByText("Mismatched team")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Course"), {target: {value: "2"}});
    expect(await screen.findByText("My second team")).toBeInTheDocument();
    expect(screen.queryByText("My first team")).not.toBeInTheDocument();
});

test("empty team state does not expose authoring controls", async () => {
    fetch.mockImplementation(url => Promise.resolve(url.endsWith("/courses") ? response({enrollments: []}) : response({memberships: []})));
    mount(<StudentTeamsPage />);
    expect(await screen.findByText("No published team assignments.")).toBeInTheDocument();
    expect(screen.queryByText("Generate Teams")).not.toBeInTheDocument();
});

test("session verification fails closed even when the browser has a cookie", async () => {
    document.cookie = "cmt_id=untrusted-browser-cookie";
    fetch.mockResolvedValue(response({}, 401));
    render(<MemoryRouter><AuthProvider><RequireAuth><div>Protected content</div></RequireAuth></AuthProvider></MemoryRouter>);
    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    document.cookie = "cmt_id=; Max-Age=0";
});

test("network errors and unknown application roles never render protected children", async () => {
    fetch.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(response({user: {...student, roles: ["unknown"]}}));
    render(<MemoryRouter><AuthProvider><RequireAuth><div>Protected content</div></RequireAuth></AuthProvider></MemoryRouter>);
    expect(await screen.findByText("Unable to verify your session.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: "Retry"}));
    expect(await screen.findByText("Your account does not have access to CMT.")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
});

test("switching verified accounts discards the previous account's mounted state", async () => {
    function AccountView() {
        const {user, refresh} = useAuth();
        const [cachedName] = useState(user.email);
        return <><span>{cachedName}</span><button onClick={refresh}>Recheck</button></>;
    }
    fetch.mockResolvedValueOnce(response({user: student})).mockResolvedValue(response({user: {...student, email: "other@rit.edu", studentProfileId: "student-two"}}));
    render(<MemoryRouter><AuthProvider><RequireAuth><AccountView /></RequireAuth></AuthProvider></MemoryRouter>);
    expect(await screen.findByText("student@rit.edu")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Recheck"));
    expect(await screen.findByText("other@rit.edu")).toBeInTheDocument();
    expect(screen.queryByText("student@rit.edu")).not.toBeInTheDocument();
});

test("verified session expiry returns to login without leaving protected content mounted", async () => {
    jest.useFakeTimers();
    fetch.mockResolvedValueOnce(response({user: {...student, expiresInMs: 1000}})).mockResolvedValue(response({}, 401));
    render(<MemoryRouter><AuthProvider><RequireAuth><div>Protected content</div></RequireAuth></AuthProvider></MemoryRouter>);
    expect(await screen.findByText("Protected content")).toBeInTheDocument();
    await act(async () => {jest.advanceTimersByTime(1100);});
    await waitFor(() => expect(screen.getByText("Sign in required")).toBeInTheDocument());
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
});
