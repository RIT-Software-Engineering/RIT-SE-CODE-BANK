# Minimal Student Records

## Data Model

- `Student` (`students` table): random UUID, nullable first/last name, normalized unique RIT email. Names are optional to accommodate incomplete existing rosters.
- Existing `TBEnrollment` remains the course/section enrollment record. Its new nullable `studentProfileId` links to `Student`; one profile can enroll in many sections, but only once per section.
- Existing `TBMember` continues to store team membership and role through the same enrollment ID. No team tables or IDs are replaced.
- A section is still represented by the existing `Course` model within a `CourseOffering`. This change does not duplicate course or section entities.

No new university ID, password, photograph, phone number, major, enrollment-status attribute, grades, assignments, assessments, or peer evaluation results are stored on Student. Existing course materials are unaffected. TA identities use the same minimal Student profile, but TA assignments and instructor permissions are not implemented here.

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

Existing instructor API mounts now require an explicit `instructor` or `professor` session role. This intentionally prevents student/TA accounts from accessing authoring endpoints, including accounts accidentally stored as Professor by the old development seed. Instructor workflows and UI remain unchanged apart from CSV requirements/help text. No separate student UI or notifications are added.

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
node --env-file=../.env tests/students.integration.test.js --database
node --env-file=../.env tests/sections.integration.test.js --database
```

The integration tests use uniquely named fixtures and clean them up. Backfill tests are scoped to those fixture enrollments, not existing user data. Coverage includes import validation/rollback, identity reuse, legacy membership preservation, existing team generation/publication, self-only access, instructor guards, preview/apply/idempotent backfill, and repeatable role-aware seeding.
