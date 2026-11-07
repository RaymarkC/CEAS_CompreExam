# Defense Request Tracking System — diagram audit

Checked against the supplied use-case diagram on 2026-10-23. **Faculty is Adviser.** The five business roles are Student, Adviser, Coordinator (Academic Coordinator), Administrative Assistant, and Dean. Super Admin remains the separate account-management role. Registrar is retained only for compatibility with older code/data and cannot be newly assigned through role management.

## Local test accounts

All five use the password `password` at `/login`:

| Role | Email |
| --- | --- |
| Student | student@uic.edu.ph |
| Adviser | adviser@uic.edu.ph |
| Academic Coordinator | acadcoor@uic.edu.ph |
| Administrative Assistant | aa@uic.edu.ph |
| Dean | dean@uic.edu.ph |

These are local demo identities, not created Google Workspace mailboxes. Local demo authentication is disabled outside local/testing environments. Google SSO refuses to link real Google identities to demo accounts. Run `php artisan demo:diagram-accounts` to reproduce the accounts locally; the command refuses to overwrite a matching non-demo account.

## Diagram coverage

| Diagram use case | Existing implementation | Assessment |
| --- | --- | --- |
| Student sends defense request | `DefenseRequirementController::store`, student defense submission form, `DefenseRequest` model | Submission implementation exists, including document storage and initial workflow history. Complete submission-to-completion behavior has not been verified with realistic records. |
| Student monitors status | Student defense listing and request details | Page responds and displays stored status/history. Needs populated workflow tests and ownership checks across all detail/download endpoints. |
| Student sends REC certificate of defense | `rec_endorsement` upload field, exposed as “REC Endorsement” | Partial semantic match. An upload exists, but a separate REC certificate workflow and certificate validation are not established by the inspected code. Confirm whether REC endorsement and the diagram's certificate refer to the same document. |
| Adviser endorses defense | `adviserDecision`, `updateAdviserStatus`, adviser request list and documents | Approve/reject actions and workflow updates exist. Important remaining gap: these actions check the Adviser role but do not consistently require ownership/assignment of the selected request. |
| Coordinator and AA assess requests | Coordinator approval/status logic, AA request-list and details pages | Pages and status actions exist. Cross-role permissions and which actor may move each workflow state need consistent enforcement. Some handlers also permit Dean beyond the diagram's responsibilities. |
| Coordinator schedules defense | Two scheduling handlers, scheduling UI, conflict service | Partial. The original handler has conflict handling; the JSON handler does not consistently perform equivalent checks. The original scheduling entry point lacks an initial role check. The JSON handler can return from inside an open DB transaction on an invalid workflow state. |
| Coordinator assigns adviser and panelists | Adviser-list management, panelist records, panel assignment endpoints | UI and persistence code exist. `assignPanelsJson` lacks an initial role check and bypasses state/history checks used by the other assignment handler. A panel-members route refers to a missing method. |
| AA tracks honorariums | Honorarium summary and CSV export, payment models, AA payment verification | The data-backed summary is now reachable. Full financial reconciliation remains unverified. The missing assistant defense-batch controller blocks its related routes. |
| Dean sets payment rates | Payment-rate table UI, validated upserts, rates database | Implemented for rate entry; automated tests verify Dean can save rates while the other diagram roles cannot. Read access for Coordinator/AA supports viewing published rates. |
| Dean configures document templates | PDF upload, template field editor, template storage, document generator | Management UI and APIs exist. Upload/field-edit/delete permissions now require Dean or technical Super Admin. Real PDF generation and field placement require a sample template and end-to-end verification. |

## Corrections made during this audit

- Created the five requested local accounts with consistent primary, foreign-key, and pivot roles.
- Added local-only password authentication for explicitly flagged demo accounts. It does not call the school portal or send email.
- Restricted new assignable business roles to the five in the diagram.
- Restricted payment-rate editing to Dean (plus technical Super Admin); other staff can view rates, with editing disabled in the UI.
- Restricted template modification and template-editor navigation to Dean (plus technical Super Admin).
- Removed the duplicate honorarium route that replaced the data-backed controller with an empty page.
- Removed the hardcoded fake honorarium payment previously injected into every summary.
- Restricted honorarium summary/export to AA, Dean, and technical Super Admin and removed the Coordinator's now-inaccessible summary link.
- Added a direct Document Templates navigation item for Dean.
- Corrected settings-link filtering and renamed the Student's defense menu label to Defense Requests.

## Verification and limits

- `demo:audit-diagram` exercised 18 authenticated GET requests against the local MySQL-backed application: all returned HTTP 200 and referenced existing React components. Details are in `diagram-audit-results.json`.
- The command also inventories routes referencing missing controllers/methods. See `broken_routes` in that JSON. Do not treat a successful dashboard request as proof that every linked action works.
- 57 focused tests passed (309 assertions), covering demo-account creation and login, role management, Google sign-in, adviser-role migration, Dean rate-edit permissions, and template-upload authorization.
- No test emails were sent, and no defense requests, financial records, or academic assignments were inserted into the user's database for the audit.
- These checks do not constitute a complete browser or end-to-end defense workflow test. Empty-state pages can load while record-specific operations still fail.

## Remaining work, in priority order

1. Add assignment/ownership authorization to all adviser actions, document uploads, student detail/download actions, and coordinator record actions. Verify denial for another adviser's/student's records.
2. Consolidate panel assignment and scheduling into single validated paths; apply Coordinator-only mutations, consistent workflow prerequisites, conflict checks, atomic transactions, and history entries.
3. Repair missing route targets (including assistant defense batching and panel-member listing), then test the forms that call them.
4. Confirm REC certificate terminology and required timing, implement any separate certificate flow, and test uploads with the intended document types.
5. Run a populated Student → Adviser → Coordinator/AA → Schedule → Honorarium scenario, with notifications faked in tests and realistic PDF templates for document output.

The current system therefore has **UI for all five roles, but is not yet fully implemented and validated against the diagram**. The remaining issues above are deliberately reported rather than described as working.
