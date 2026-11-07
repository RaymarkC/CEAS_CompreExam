# Assigning account roles

Sign in as **Super Admin**, open **Dashboard → Users → Assign Account Roles**, search for an account, select a role, and choose **Save role**.

Supported business roles follow the diagram: Student, Adviser, Academic Coordinator (stored as `Coordinator`), Administrative Assistant (AA), and Dean. Accounts must exist before they appear in the list. New registrations can request only the Student role. The Super Admin can then select the appropriate staff role. Local demo accounts are available through `demo:diagram-accounts`; see `diagram-implementation-audit.md`.

The update is restricted to Super Admin on the server. Super Admin accounts are protected from changes through this screen. Saving replaces the account's previous primary role, foreign-key role, and pivot memberships together. Profile information and academic relationships are retained. Changes are recorded in the application log with actor/target IDs and old/new roles.

Manual assignments are marked in `users.role_manually_assigned` so subsequent school-portal login and enrichment cannot reset them or append extra role memberships. Google SSO preserves the assigned role as well.

Apply the new migration before using role management:

```sh
php artisan migrate
```

Use `npm run dev` for development or `npm run build` for compiled assets. After assigning Coordinator, use the separate **Coordinator Assignments** tab to set the programs they manage.

Regression tests:

```sh
php vendor/bin/pest tests/Unit/UserRoleManagementTest.php tests/Unit/AdviserRoleTest.php tests/Unit/GoogleSignInTest.php
```
