# Automated check and runtime fixes — October 25, 2026

The two GitHub workflows previously failed at frontend linting and at two outdated starter tests. The login test now submits the real identifier field using a deliberately created local demo account and confirms that school services are never called. Invalid-password coverage checks the credential error, and the homepage test now expects the actual redirect to login.

## Runtime corrections

- Split the adviser and coordinator detail screens into missing-data and loaded components, preserving stable React hook order when a request is unavailable or changes.
- Replaced the coordinator notification button's invalid hook call with an ordinary request. Each row sends its own request ID.
- Panel submissions transform their current values before posting, avoiding stale form state.
- The dashboard submission age uses a valid submitted/created timestamp, rather than interpreting a student/user ID as a date.
- Comprehensive Exam eligibility retries are bounded to five retries and pending timers are cleared when leaving the screen.
- The System Status screen now uses an authenticated endpoint that runs a database query, checks the signed-in session, and checks notification storage. It no longer shows simulated successes or updates nonexistent row indices. It explicitly does not certify actual email delivery or worker operation.
- Replaced unsafe explicit types with domain types, narrowed caught errors, fixed the signature drag/drop input shape and legacy form error setter, and consolidated duplicate panelist declarations.
- Removed unused bindings, disconnected helpers, an unreachable duplicate calendar table, and an orphan Jest example whose component import did not exist. No application feature was removed from a working user flow.

## Checks

Validated locally:

- Full PHP suite: **171 passed, 837 assertions**.
- ESLint: **zero errors and zero warnings**.
- TypeScript: passed.
- Prettier formatting check: passed.
- Pint formatting check: passed across 333 PHP files.
- Production frontend build: passed.

The cleanup also formats existing PHP and frontend sources, so the diff includes many formatting-only changes. Generated build assets are refreshed for installations without a frontend development server.

GitHub workflows use Node 22, current checkout/setup actions, reproducible npm installs, read-only repository permissions, and non-mutating formatting/lint checks. TypeScript is checked in GitHub as well. No lint rule was disabled to obtain a passing result.

These checks cover the reported automated failures and the related runtime issues identified during cleanup. They do not establish that every possible business scenario is implemented. The existing integration guide still records the inherited missing route handlers, unverified school-service access, and workflow decisions that require client review. No database records, .env secrets, or uploaded documents are included in the commit.
