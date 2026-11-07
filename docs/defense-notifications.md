# Defense notifications

In-app alerts are created automatically when a student submits a defense request, an adviser endorses or rejects it, the coordinator approves or rejects it, or its schedule changes. The assigned adviser and identifiable academic coordinator receive submission alerts. The coordinator also receives an alert after adviser endorsement. Students receive decision and schedule alerts.

Recipients are resolved from the request assignment, the student's adviser assignment, adviser/coordinator links, and program assignments. Ambiguous program mappings are not broadcast to unrelated coordinators. Assign a coordinator explicitly when multiple people cover the same program.

Students receive one countdown per defense per Philippine calendar day during the final seven days, plus defense day before the scheduled start. Only scheduled or approved defenses with a date qualify. Completed, rejected and cancelled requests are excluded. Rescheduling clears unread reminders for the old schedule. Repeated page visits and scheduler runs do not duplicate reminders.

The bell refreshes every 30 seconds while the tab is visible and when focus returns. Clicking an unread notification marks it read before opening its page. Read operations enforce account ownership.

## Run locally

Restart `npm.cmd run dev` to start the server, frontend, queue worker and reminder scheduler together. The scheduler checks reminders at 8:00 AM Asia/Manila. Reminders also catch up when a student opens the system or its notification feed.

To check reminders immediately: `php artisan defenses:send-reminders`.

On a deployed server, run Laravel's scheduler every minute (`php artisan schedule:run`) using the hosting platform's task scheduler. The application must be running for notification delivery; these are in-app alerts, not browser push notifications.

Email delivery remains controlled by the existing mail settings. With `MAIL_MAILER=log`, emails are logged rather than delivered. The new countdown feature uses in-app notifications.

Settings: `config/defense-notifications.php`. Tests: `tests/Unit/DefenseNotificationsTest.php` (isolated SQLite data).
