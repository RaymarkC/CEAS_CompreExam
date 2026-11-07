# Google sign-in setup

Google sign-in is available as an alternative to the existing credentials form. It accepts verified Google Workspace accounts in the `uic.edu.ph` hosted domain and signs in an existing system account with the same email. It never creates accounts or assigns roles from Google profile information. Existing passwords, roles, and academic assignments remain in place.

## Configure Google Cloud

1. Open https://console.cloud.google.com/ and select or create your team's project.
2. Configure the Google Auth Platform branding and audience. Use an Internal audience if the project belongs to UIC's Workspace organization and only organization users should access it. For an External app in testing, add permitted test users and follow your organization's policies.
3. Create an OAuth client with application type **Web application**.
4. Add this exact authorized redirect URI for local development:

   `http://127.0.0.1:8000/auth/google/callback`

5. Copy the client ID and client secret into your local `.env` file. Do not commit the secret or paste it into chat.

```dotenv
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback
```

For a deployed environment, register its HTTPS callback in Google Cloud and use that exact URL in `GOOGLE_REDIRECT_URI`. Use the same hostname throughout a login attempt; switching between localhost and 127.0.0.1 can lose the session cookie and invalidate OAuth state.

## Apply and run

```sh
php artisan migrate
php artisan config:clear
npm run dev
```

For a deployment using compiled assets, run `npm run build` instead of the development server. Restart long-lived application processes after changing environment configuration.

The Google button is disabled until credentials are configured. After configuration, open `/login` and choose **Sign in with Google**. Use a Google Workspace account whose email matches an existing local account. An administrator must arrange the account's role separately; SSO does not determine whether someone is a student or adviser.

## Behavior and verification

- Socialite validates the callback's session state. The implementation does not use `stateless()`.
- The server checks Google's verified-email and hosted-domain claims; the `hd` authorization parameter alone is not trusted.
- The Google subject ID is stored uniquely to prevent a different Google identity from replacing a linked identity.
- OAuth access/refresh tokens are not persisted. Only basic identity scopes are requested.
- Domain mismatches, missing accounts, cancelled consent, expired sessions, and provider failures return a message on the login page.

Run the focused tests with:

```sh
php vendor/bin/pest tests/Unit/GoogleSignInTest.php tests/Unit/AdviserRoleTest.php
```

Tests simulate provider responses and use an in-memory database. A complete live Google sign-in still needs valid OAuth credentials and an allowed school account.

References: https://laravel.com/docs/12.x/socialite and https://developers.google.com/identity/openid-connect/openid-connect
