# Defense Register and service-based honorarium preparation

The Defense Register applies the structure of the supplied historical defense timetable to current system records. The historical workbook and its personal records are not imported, copied into the repository, or used to infer attendance, payment, or rates. Statistician, data analyst, and editor payments remain pending a confirmed client policy.

## Open the feature

Open **Defense Register** from the sidebar or visit `/defense-register`. It is available to coordinators, AA, Dean, Finance, advisers, and Super Admin. Students cannot access these internal exports. Coordinators only see requests assigned to them; advisers only see their assigned or email-linked panel requests. Finance and advisers have read-only access to classifications and service confirmation.

Choose a date range and apply it. The list contains active scheduled or completed defenses in that range. It starts with the current Philippine calendar month. No rows appear until requests are scheduled. Each query/export covers at most 93 days.

## Schedule output

- **Download Excel** creates a real `.xlsx` with `Schedule`, `Defense details`, and `Recipient service` worksheets. The schedule has dates across columns and time/detail groups down rows, preserving simultaneous sessions as separate numbered entries. Unclassified panelists are labeled explicitly. Dates are real Excel dates; uploaded titles and names are literal text, not formulas.
- **Print / Save as PDF** opens a print layout. Use the browser's print command to print or save PDF. It splits the date columns into groups of five for readable landscape output; the selected range and Philippine time convention appear above the table.
- Exports use the displayed/applied dates, not unapplied edits in the date inputs. They enforce the same visibility rules as the register.

## Classify the committee

The assigned Coordinator, AA, Dean, or Super Admin can open **Panel types / service** and explicitly select Internal or External for each panel assignment. Chair/member remains a separate role. Nothing assumes the first or last name in a spreadsheet determines a person's role.

Use **Save panel classifications** before sending the current panel breakdown to Finance. Classification changes require a reason once classifications already exist, are recorded in workflow history, and invalidate previously submitted/verified panel breakdowns. Finance sees the role and classification captured in the submitted breakdown. Earlier service confirmation becomes stale when assignments, classifications, program, defense type, or schedule details no longer match.

## Confirm actual service

After the scheduled end time, authorized staff explicitly confirm that the defense was held, enter its actual completion date, and record Rendered service or Absent for every assigned panelist and adviser. A registered roster, saved classifications, and recorded start/end times are required. Future completion dates and dates preceding the scheduled defense are rejected.

Confirmation marks the defense Completed. It does not mark any honorarium approved, disbursed, or claimed. Revisions require an explanation and retain the previous attendance record, actor, timestamp, and notes. Earlier unpaid prepared/approved honoraria are voided for preparation again. Disbursed/claimed records remain intact and are flagged for Finance reconciliation.

## Prepare honoraria

Both current Finance documents must still be verified. Honorarium preparation also requires matching current completion/service evidence. Only recipients marked Rendered service are included. Payment rows snapshot the recipient's classification, confirmed service evidence, and configured amount.

- Internal chairs use the existing chair rates.
- Internal members use their numbered `Panel Member 1`–`Panel Member 4` rate when configured, or an existing generic `Panel Member` rate.
- External chairs require a positive **External Panel Chair** rate; external members require a positive **External Panel Member** rate. These options are available in the Dean's Payment Rates screen. No external amounts are invented or copied from internal rates.
- External honorarium rate options are excluded from the existing base student-fee subtotal. This feature does not establish a new student charge or fee policy.
- Disbursement cannot precede the confirmed completion date. Changes to evidence block further payment transitions until corrected; paid reconciliation remains a Finance decision.

## Updating another installation

After pulling the update, run `php artisan migrate` and `npm.cmd run build`, then restart the development command. The migration adds a nullable classification field, service records, and nullable evidence fields on payments. It does not fabricate service evidence for older payments. Confirm legacy unpaid requests and prepare again; existing paid records are retained for review rather than automatically rewritten.

PHP's Zip extension must be enabled for Excel exports (already listed in the groupmate prerequisites). Browser PDF saving does not require a separate PDF package.

Validation includes the full PHP suite, frontend types/lint/formatting, the production build, actual workbook parsing with an independent reader, and rendered inspection of all three exported worksheets using synthetic data. The workbook itself remains unchanged.

Final local results: **193 tests passed, 976 assertions**, zero lint errors/warnings, TypeScript passed, formatting checks passed across 339 PHP files and the frontend, and the production build passed. No new third-party spreadsheet package was installed.
