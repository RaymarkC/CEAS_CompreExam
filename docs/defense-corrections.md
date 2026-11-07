# Request progress and corrections

Students can open a request on Defense Requests to see the completed milestones, who needs to act next, and its activity history.

## Return and resubmit

1. The assigned adviser opens a request awaiting adviser review, or the assigned academic coordinator opens an endorsed request awaiting coordinator review.
2. Choose **Return for corrections**, enter the changes required, then send. This is separate from rejection; a correction request remains active.
3. The student receives an in-app notification. Open the same request to read the notes, optionally correct the thesis title or replace documents, and enter a required response explaining the changes.
4. Choose **Resubmit corrections**. Unchanged attachments remain attached. Previous uploaded versions are retained, and replacement paths plus the student response are recorded in the activity history.
5. The request returns to the reviewer who requested corrections. Adviser corrections return to adviser review; coordinator corrections return to coordinator review with the adviser endorsement retained. The reviewer receives an in-app alert.

Only the assigned reviewer can return a request at their active review stage. Only the student who submitted it can resubmit it. Approval and scheduling are blocked while corrections are pending. Repeat resubmission cannot duplicate a request. Students cannot start a new request while an existing one awaits corrections.

The new correction alerts are in-app. Email delivery has not been added to this flow.

## Local setup and checks

Migration: `php artisan migrate` (applied to the local database during implementation).
Run: `npm.cmd run dev`, then refresh the browser.
Tests: `php vendor/bin/pest tests/Unit/DefenseCorrectionsTest.php`.

Automated tests use an isolated SQLite database and fake uploaded files. They do not create demonstration defense requests in the local application database.
