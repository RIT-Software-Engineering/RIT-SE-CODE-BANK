# Minimal Student Records

## Data Model

- `Student` (`students` table): random UUID, nullable first/last name, normalized unique RIT email. Names are optional to accommodate incomplete existing rosters.
- Existing `TBEnrollment` remains the course/section enrollment record. Its new nullable `studentProfileId` links to `Student`; one profile can enroll in many sections, but only once per section.
- Existing `TBMember` continues to store team membership and role through the same enrollment ID. No team tables or IDs are replaced.
- A section is still represented by the existing `Course` model within a `CourseOffering`. This change does not duplicate course or section entities.

No new university ID, password, photograph, phone number, major, enrollment-status attribute, grades, assignments, assessments, or peer evaluation results are stored on Student. TA identities use the same minimal Student profile. Section teaching assignments are described below.

## Roster Import

The existing Team Builder CSV upload now requires `email`; `firstName` and `lastName` are optional:

```csv
email,firstName,lastName
example@rit.edu,Example,Student
```

Emails are trimmed and lowercased. By default only `rit.edu` is accepted; a deployment can explicitly configure additional institutional domains with `CMT_STUDENT_EMAIL_DOMAINS=rit.edu,another-approved-domain.edu`. A matching domain does not authenticate the student: authentication still requires a verified session.

Imports reuse the same Student across courses and update an existing enrollment by email/profile without replacing its ID or team memberships. Importing does not withdraw students missing from the CSV. Duplicate compatible rows collapse into one entry. Invalid emails and conflicting names reject the entire transaction; errors identify the CSV row/entry without returning personal data.

Roster uploads do not overwrite an existing canonical Student name. Verified authentication may refresh the signed-in student's name. Unknown CSV columns, including `studentId`, are ignored and are not newly persisted. Legacy `TBEnrollment.studentId` values are retained, not copied into Student. Clearing those values requires a separate reviewed cleanup.

## Authenticated APIs

All endpoints use the existing server-verified `cmt_id` identity, with a `student` or `ta` role:

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/cmt/students/me` | `{student: {id, fname, lname, email}}` for the signed-in identity |
| GET | `/api/cmt/students/me/courses` | `{enrollments: [...]}` with minimal active, non-template course/section details |
| GET | `/api/cmt/students/me/teams` | `{memberships: [...]}` containing only the student's published team memberships and role |

The student UUID is resolved from the authenticated email, never from a request-body/query email, UID, or supplied profile ID. Login/profile lookup does not automatically enroll anyone. Draft/archived team sets, inactive courses, private workflow data, other students' records, and classmates' identities are not returned. There is no public student-directory endpoint or unauthenticated profile-edit API.

Instructor APIs resolve the verified email to a canonical Professor profile and check ownership or an explicit section instructor assignment. A legacy Professor row alone does not grant a student teaching access. Section TA assignments use dedicated endpoints with narrower permissions.

## Section Teaching Roles

- `Course.professorId` identifies the section owner. `SectionInstructor` assigns additional instructors. `SectionTA` assigns a Student profile as a TA. Both assignment tables record the assigning professor and creation time, with one assignment per section/profile.
- `TBEnrollment` remains the student enrollment authority. A student may be enrolled in one section and TA another. Assigning a TA does not enroll them or add them to student teams.
- Owners manage section staff and archive/restore their section. Additional instructors edit section materials, sessions, resources, and teams. Shared course metadata and section creation additionally require ownership of the course offering.
- TAs view shared session materials and update block completion in assigned active sections. Personal Notes are excluded. Material editing, cancellation, roster/team management, staff administration, and archiving require instructor/owner capabilities.
- `GET /api/cmt/teaching/sections` lists the signed-in user's active teaching sections and capabilities. `GET /api/cmt/teaching/sections/:courseId` returns the teaching schedule. `PATCH /api/cmt/teaching/sections/:courseId/blocks/:blockId/status` accepts only a block status.
- Owners list/add staff with `GET/POST /api/cmt/teaching/sections/:courseId/staff` and remove assignments with `DELETE /api/cmt/teaching/sections/:courseId/staff/:role/:id`. Add requests contain an existing profile's RIT email and `INSTRUCTOR` or `TA`. A global TA label does not identify an assigned section.
- Backend permission checks read current assignments on each request. Removing an assignment revokes access with the same session cookie. Bulk content operations authorize every destination before writing. Workflow callbacks verify their action state belongs to an authorized section.
- Section comparisons include related active sections across instructors. Responses redact inaccessible section details and link only to accessible sections. `SectionSyncAcknowledgment` records each instructor's dismissal for an issue occurrence.
- The frontend adds Teaching Sections and a section-owner Teaching staff modal using existing Bootstrap styling. TA sections show shared materials and colored progress selectors. Enrollment-based My Learning remains available alongside teaching assignments.
- Apply the additive schema with the project's reviewed database rollout process, then regenerate Prisma Client before starting the updated backend. Existing ownership and enrollment records require no role backfill.

## Student Role And UI

- `GET /api/cmt/auth/me` returns the server-verified name, email, recognized roles, optional canonical Student UUID, remaining session lifetime (`expiresInMs`), and database-derived `hasTeachingAccess`, `hasInstructorAccess`, and `hasEnrollment` navigation flags. Backend section checks remain authoritative. Unauthenticated/expired sessions return 401; sessions without a recognized CMT role return 403.
- The shared frontend `AuthProvider` verifies the session with that endpoint, rechecks on window focus/visibility and expiry, and discards mounted views when the verified account changes. Existing instructor cookie helpers remain compatible, but frontend route guards and navigation use verified session state instead of trusting decoded cookies.
- `RequireAuth` now enforces its `roles` prop. All instructor authoring routes, including course pages and both workflow-builder views, are guarded. Backend checks remain authoritative.
- Student-only and TA-only identities enter `/cmt/student/courses`. My Courses shows only their own active section summaries; My Teams shows only their own published team assignments/roles, with a section filter. No classmates' roster, private materials, or instructor edit controls are exposed.
- Faculty accounts retain the instructor home. A learner with an active teaching assignment enters Teaching Sections and can also open My Learning. Assigned instructors receive capabilities only for assigned sections. Faculty with student enrollments can open My Learning through the database-derived flag.
- Loading, empty, retry, session-expiry, unauthorized-role, and logout states are handled explicitly. Session, student, and teaching endpoints send `Cache-Control: private, no-store`; student data is not persisted in browser storage.
- Course schedules/materials are available through the assigned teaching view. Student publication rules and institutional SSO wiring remain separate feature concerns.

Email is the current matching key. Email changes/reassignments and conflicting legacy identities require administrative review; do not merge profiles by name. Production deployment must use trusted institutional authentication and a non-default JWT secret. This change does not replace or repair the unused legacy `shibbLogin.js` route.

## Setup And Backfill

From `apps/cmt/backend`, with the usual local database running:

```powershell
npx dotenv -e ../.env -- npx prisma validate
npx dotenv -e ../.env -- npx prisma generate
npx dotenv -e ../.env -- npx prisma db push --skip-generate
node --env-file=../.env prisma/backfill-students.js
node --env-file=../.env prisma/backfill-students.js --apply
node --env-file=../.env prisma/seed.js
```

The project currently uses `prisma db push`. Review its schema warnings before applying; the new unique enrollment constraint can produce a warning even though the new nullable link has no populated values. Do not reset the database. For deployed databases, take a backup and use the team's approved schema rollout process.

Backfill defaults to a read-only preview. `--apply` links only consistent records with approved institutional emails, preserving enrollment/team IDs. Missing emails, conflicting names, duplicate section records, mismatched existing links, and a legacy ID associated with multiple emails are reported for review and skipped. Reports contain enrollment IDs/reasons rather than emails, names, or university IDs. Rerunning the operation does not duplicate profiles or links.

Development seeding is idempotent and role-aware: instructors get Professor records; students/TAs get Student profiles. Existing incorrectly seeded Professor rows are deliberately not deleted, so dependent records remain intact; role checks prevent those rows from granting access.

## Verification

```powershell
node tests/students.test.js
node tests/auth.test.js
node --env-file=../.env tests/students.integration.test.js --database
node --env-file=../.env tests/sections.integration.test.js --database
node --env-file=../.env tests/sectionPermissions.integration.test.js --database
```

From `apps/cmt/frontend`, run `npm test -- --watchAll=false --runInBand src/student-role.test.jsx` for student routing/navigation, role combinations, loading/empty/error/retry states, expiry, and account-switch isolation. `npm run build` verifies the production bundle.

The integration tests use uniquely named fixtures and clean them up. Backfill tests are scoped to those fixture enrollments, not existing user data. Coverage includes import validation/rollback, identity reuse, legacy membership preservation, existing team generation/publication, self-only access, instructor guards, preview/apply/idempotent backfill, and repeatable role-aware seeding.
