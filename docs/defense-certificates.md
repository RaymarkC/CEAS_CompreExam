# Defense certificates

1. Coordinator opens Academic Progress, selects a student and records a scheduled defense as Done and Passed, with actual completion date and research subject.
2. Student opens Certificates and clicks Request for Certificate for that defense. Duplicate clicks reuse the request. Administrative Assistants receive an in-system notification.
3. AA opens Certificates, uploads a PDF (maximum 10 MB) and chooses Release PDF to student, optionally checking Also email the PDF.
4. The student receives an in-system notice and can download the released private PDF. AA can separately Send PDF by email or retry a failed email.

The PDF is stored on the private local disk and served only to its student owner or AA through an authorized route. Email always targets that student’s registered account email. No arbitrary recipient input is accepted. Local log/array mailers are not treated as real delivery outside automated tests. Configure a working delivery mailer before a real email test; no credentials are committed.

An email failure does not remove the in-system PDF. Email status and release/delivery history are visible to AA. A mail service accepting an email does not guarantee that it reaches an inbox.

Eligibility is tied to the exact defense, current academic outcome version and schedule/panel snapshot. If defense information changes, download and email are blocked until the Coordinator reconfirms the outcome and AA releases an eligible PDF again. Outcome revisions preserve history and mark prior releases for review. These controls cannot recall a PDF already downloaded or emailed.

This is a defense certificate, not an automatic graduation or program completion certificate. AA uploads the school-approved wording; the system does not generate or assert a credential.

## Setup

Run php artisan migrate after pulling, then rebuild frontend assets if needed. The November migration adds academic metadata and two new tables; it does not replace student or defense data.

## Checks

AcademicOutcomeCertificateTest verifies access restrictions, eligibility, duplicate requests, result history and stale edits, PDF type validation, private downloads, email attachment delivery, SMTP failure recovery and retry, schedule-change invalidation, scheduling restrictions, academic dates, and scoped CSV export.
