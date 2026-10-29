# Related Course Sections

The existing `Course` record remains the section's dashboard and storage boundary.
`CourseOffering` links related sections for one instructor and teaching term.
Existing course URLs and IDs remain valid. Templates are not offerings.

## Behavior

- Add a section from its course dashboard. It copies sessions, blocks, student-facing
  material, file resources, syllabus, and workflow definition. Rosters and private
  notes are not copied. Choose fresh progress or copy the source section's progress.
- Section copies have independent database IDs and workflow states. Shared keys
  identify corresponding sessions, blocks, materials, and resources.
- Remove section archives the current section after confirmation. It uses the
  existing course archive endpoint, preserves its contents, and excludes it from
  sync comparisons. The instructor is redirected to a remaining section or to My
  Courses if none remain. Archived sections can be restored from My Courses.
- Material creation/editing and block creation offer This section / All sections.
  Content applied to all sections keeps their individual completion statuses.
  Resource links are rewritten to the receiving section's resource records.
- A block's copy control applies its material to the other sections and creates
  missing block copies, while preserving existing section completion statuses.
- A block's remove control deletes that block from the current section after
  confirmation. Its materials remain in the same session with no block assigned,
  remaining blocks are reordered, and sync is recalculated. Other sections keep
  their copies of the block.
- Blocks completed in some sections but incomplete in others are out of sync.
  Not started versus In progress is considered incomplete in both sections.
- Weekly plans compare linked blocks and student-facing materials, their content,
  and teaching weeks. Different meeting days within a week are fine. Private notes
  and inactive material are excluded. Independently authored items are not matched
  automatically by title. Archived sections are excluded.
- Dated sessions use Monday-based weeks relative to the offering's start date.
  Undated copied sessions retain their planned week. Moving a block preserves its
  identity, so completion comparisons continue after rescheduling.
- Canceled sessions with unfinished work produce a review warning. Canceling does
  not modify block progress or automatically reschedule work.
- Warnings are stored in MySQL. Dismissal survives reloads; resolving a discrepancy
  and encountering it again creates a new notification occurrence. The warning's
  review action opens the affected section and session.
- The current tab checks after relevant edits, on focus, and every 20 seconds while
  visible. Notifications are in-app only. Static website ZIPs require regeneration.

## Database Setup

From `apps/cmt/backend`, using the environment for the intended database:

```powershell
npx dotenv -e ../.env -- npx prisma validate
npx dotenv -e ../.env -- npx prisma generate
npx dotenv -e ../.env -- npx prisma db push --skip-generate
node --env-file=../.env prisma/backfill-sections.js
```

The schema additions are optional relationships/shared keys plus new tables. On the
first push, Prisma may warn about the unique `(offeringId, section)` constraint.
`node --env-file=../.env prisma/backfill-sections.js --check` checks for conflicts;
review the push output before accepting any warning. Do not reset the database.
The backfill is idempotent and gives every existing non-template course its own
offering; it does not automatically merge similarly named courses.

## Verification

```powershell
# Backend, from apps/cmt/backend
node --test tests/sectionSync.test.js
node --env-file=../.env tests/sections.integration.test.js --database
node --env-file=../.env tests/sections.workflow.test.js --live-workflows
```

The integration test uses temporary, uniquely owned database fixtures and removes
them afterward. External Workflows responses are mocked by default.
The live-workflow test requires the existing Workflows API to be running and
creates/removes its own workflows as well as temporary CMT database fixtures.

The browser test is `apps/cmt/frontend/tests/sections.browser.mjs`. Run it against
the frontend development server with `node tests/sections.browser.mjs` from the
frontend directory. It uses mocked API data, leaving actual courses untouched.
Provide `CMT_PLAYWRIGHT_MODULE` with an absolute path to Playwright's `index.mjs`, or
install Playwright temporarily under `$env:TEMP/cmt-section-browser`. Chrome is
used in headless mode. No application dependency changes are required.
