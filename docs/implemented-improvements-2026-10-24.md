# Integrated improvements on October 24 2026

Implemented in Graduate_School_Integrated only. Existing project folders are preserved.

## Honorarium Payments

Open Honorarium Payments in the sidebar, or visit /honorarium-ledger. AA prepares recipient records after Finance verifies the current receipt and panel breakdown. Select school year and semester. Amounts are copied from the dean's configured rates for that program level and defense type. Program classification now matches degree words/abbreviations, so a master's program containing 'administration' is not mistakenly classified as a doctorate. Missing, zero, or ambiguous rates block preparation instead of guessing an amount.

Finance records sequential approval, disbursement and claiming. A disbursement requires a completed defense, date, and payment reference. Claiming cannot precede disbursement. These actions record confirmed payments; they do not transfer money. Recipient records include history, filters, and CSV export. Advisers see their own recipient records. Coordinators see records for their assigned requests. AA/Finance access follows the existing module's staff permissions.

## Defense changes and Finance re-verification

Changes to a receipt, panel, adviser, program, or defense type mark affected submitted/verified Finance documents as needing re-verification. Their previous snapshot and review are retained in the activity history. Unpaid ledger entries are voided and retained; disbursed/claimed entries are flagged for manual Finance reconciliation. Such flagged payments cannot advance through the UI. The system does not attempt refunds or automatic accounting adjustments. AA and Finance receive in-app alerts; students receive panel-change notices.

## Scheduling

The coordinator's panel and scheduling save paths use one service. It checks overlapping time ranges for panelists, advisers, students and physical rooms, allows back-to-back bookings, rejects duplicate panel positions, and rejects past dates/times using Philippine time. A database mutex serializes booking writes across requests. Coordinators can edit only requests assigned to them. Existing AA/Dean scheduling access is preserved. A known broken panel-list endpoint is repaired; selector IDs are resolved to registered panel records and student views show names. Date fields remain separate from honorarium disbursement dates.

## Comprehensive Exam eligibility

Submission now checks the existing school eligibility API on the server. A direct form POST cannot bypass an unverified result. A missing school portal session remains a blocker rather than being treated as eligibility. Local demo accounts still do not have live school records. This change does not add or certify Registrar/Dean approval, proctor invitations, or result release workflows.

## Optional countdown email

The countdown service can queue an email in addition to the in-app reminder. Repeated checks do not queue another job for the same daily notice. Jobs skip obsolete dates, cancelled/completed defenses and changed schedules. The email template links to the current request. Enable DEFENSE_REMINDER_EMAILS=true after mail configuration. It is disabled by default. With MAIL_MAILER=log, email content is logged locally rather than sent to Gmail. Keep the queue worker running for enabled email jobs; npm.cmd run dev starts the worker and scheduler.

## Remaining dependencies

Live school portal access, SMTP credentials, Google OAuth authorized redirect settings, production hosting and school acceptance testing still require their respective configuration. Paid-record reconciliation policy needs Finance input. Fifteen inherited missing route handlers remain outside the implemented flows. This change fixes the panel registry handler but does not claim that every legacy screen is complete.

## Verification

The test suite uses isolated SQLite fixtures and fake mail/queues, never real transfers. Tests cover role scoping, recipient rate snapshots, invalid transitions, receipt/panel changes, school eligibility enforcement, scheduling overlaps and optional countdown email jobs. Migrations are applied only to grad_integration_db. The original grad_db database was not changed.

Final verification: 142 tests passed (757 assertions), TypeScript check passed, and production build passed. The Honorarium Payments screen was opened with the Finance demo account in the browser.
