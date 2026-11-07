# Adviser student progress

Open **My Students → Assigned → View Progress** as the student’s accepted adviser.

The page shows the current defense stage and workflow, Proposal/Prefinal/Final milestones, and defense history. Defense information comes from existing requests. A scheduled or automatically completed defense is not proof of attendance or graduation; a matching service confirmation is required to label a defense as held.

The assigned Coordinator may record enrollment year, program completion year, semester, and subjects after checking official school records. Each save requires a source/reference note and confirmation that school records were checked. Missing years stay unavailable; they are never inferred from account dates or student numbers. Completion year must be on or after enrollment year, and future years are rejected.

These are coordinator-recorded references, not automatic Registrar certifications. Program completion is separate from final defense completion. Cached school-portal subjects are shown separately with their last-sync date and do not establish live enrollment.

The accepted adviser, assigned Coordinator, and Dean can read this page; only the assigned Coordinator may update it. Pending, rejected, revoked, unrelated advisers and unauthorized roles cannot access it. Prior record values are preserved in the database history; concurrent stale edits are rejected so they cannot silently overwrite newer information.

## Setup after pulling

Run `php artisan migrate` before opening My Students. The progress migrations add the progress table, academic metadata, outcome records and certificate requests; they do not overwrite student or defense records. Use `npm install` and `npm run build` when rebuilding assets, or the normal development command.

## Validation

`php artisan test --filter=AdviserStudentProgressTest` covers authorization, honest missing values, record validation, history, stale edits, defense service evidence, current stage selection, and school-subject privacy.

## Student list filters

The adviser’s Assigned tab combines name/ID/email/program search with defense stage, enrollment year, completion year, recorded semester, and subject name/code filters. Subject and semester filters use coordinator-recorded information, not cached portal subjects. The default sort is newest progress update first (latest defense update or academic record update). Enrollment year can be sorted in either direction; missing years and update dates stay last. Name A–Z, matching counts, and Reset filters are available. Pending assignments are not filtered by academic progress.

## November interview workflow

Academic Progress is available in the Coordinator, Adviser and Dean sidebars. Only Coordinators may edit scoped student records; accepted assigned Advisers and the Dean view them. Coordinator scope comes from defense request assignment or the coordinator who requested the adviser/student connection.

Classification is explicitly New or Continuing. A separate Previously did not defend filter includes missed-defense history, even after a later outcome revision. Each research subject (Thesis 1/2 or Dissertation 1/2) includes a start date, school year and semester. Previous saved subjects remain visible in record history.

Within a student’s defense history, the assigned Coordinator records completion (Not yet done, Done, Did not defend) separately from result (Not recorded, Passed, For revision, Repeat defense). A missed defense requires a reason. Done requires an actual completion date after the scheduled session ends. Revisions require notes and preserve the previous values. Only a Passed defense may explicitly record the next sequential stage; no new request, recipient service confirmation or graduation is inferred.

Defense Register now offers CSV alongside Excel and Print/Save as PDF. The same date range and authorization scope apply. Exports include the recorded academic outcome and whether it still matches the defense information. Spreadsheet formula-like CSV values are escaped.

Only the assigned Coordinator may assign panels or save defense schedules through current and legacy scheduling routes. Dean and AA retain read access.
