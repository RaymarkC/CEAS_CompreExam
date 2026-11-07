# Faculty → Adviser revision

The application's role is now **Adviser**. This covers staff login and role assignment, dashboard selection, sidebar and quick actions, student adviser search, coordinator panel selectors, defense notifications, settings, account summaries, and development seeders.

## Main code locations

- `app/Http/Requests/Auth/LoginRequest.php` and `LoginRequestV2.php`: create staff accounts with the Adviser role.
- `app/Models/User.php`: normalize the retired role name for legacy callers and serialized user data.
- `app/Services/LegacyPortalClient.php`: map the school portal's external Faculty label to Adviser locally.
- `resources/js/pages/dashboard/Index.tsx` and `dashboard-layouts/adviser-dashboard.tsx`: select and render the Adviser dashboard.
- `resources/js/components/app-sidebar.tsx`: show Adviser navigation and student/defense links.
- `routes/web.php` and `resources/js/pages/adviser/`: Adviser search and class-list pages.
- `app/Services/AdviserSuggestionService.php`, `DefenseNotificationService.php`, and defense/panelist controllers: look up Adviser users.
- `database/migrations/2026_10_22_000001_rename_faculty_role_to_adviser.php`: convert existing role data.

## Apply to an existing installation

After backing up the deployment database, run these commands from the project directory with the deployment's usual environment configured:

```sh
php artisan migrate
npm run build
php artisan optimize:clear
```

The migration converts `users.role`, updates `users.role_id`, and retains `role_user` memberships. If Faculty and Adviser roles both exist, their memberships are merged without duplicate pivot keys. Other roles and student/adviser assignments are retained. Existing honorarium type labels are also converted. The migration ensures an Adviser role exists on new installations.

The migration's `down()` deliberately retains the converted data: after a merge there is no reliable way to distinguish former Faculty memberships from pre-existing Adviser memberships. Restore a database backup if an exact data reversal is required.

Old faculty search/class-list URLs and the `faculty:validate-names` command remain compatibility aliases. Historical migrations retain their original names and logic. The external school portal can continue sending Faculty titles.

## Validation

```sh
php vendor/bin/pest tests/Unit/AdviserRoleTest.php
npm run build
```

The focused tests use an isolated in-memory database to cover role renaming, role merging, preserved memberships, fresh database behavior, user serialization, legacy portal mapping, and both search URLs. They do not require or modify the deployment database.
