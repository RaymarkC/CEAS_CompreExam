# Render testing deployment

This repository runs Laravel/PHP through Docker. Select Docker, branch main, empty Root Directory, Dockerfile path ./Dockerfile, Free instance, health check /up, and leave Docker Command empty. Node start/build commands do not apply. The Dockerfile builds React assets and installs PHP dependencies without including the local environment file, database dumps, signatures, uploads or logs.

## Current preparation status

Docker and runtime configuration are provided. Aiven database provisioning, upload persistence, cloud demo-account setup and live deployment verification are still required. Do not use real student records for this test deployment. No cloud resources have been created by these files.

## Database and environment

Create a separate Aiven Free MySQL service. Enter its host, port, database, username and password only in Render Environment. Add its CA certificate through Render Secret Files named aiven-ca.pem, then set MYSQL_ATTR_SSL_CA=/etc/secrets/aiven-ca.pem. See deploy/render.env.example for the remaining values.

Generate a NEW APP_KEY locally using php artisan key:generate --show and put it directly in Render Environment. Keep the same key on later deploys. Do not copy your existing local environment or app key to a public repository. APP_URL must match the HTTPS address assigned to the new Render service. Google OAuth requires a matching callback URL and is configured separately.

RUN_MIGRATIONS=true applies normal migrations on startup against the configured testing database. It never uses migrate:fresh or seeds/replaces existing records. If a migration fails the service stops rather than continuing with a partial schema.

APP_ENV=production and APP_DEBUG=false are required. Database sessions survive app restarts. QUEUE_CONNECTION=sync processes queued work during the current request for this small demo; it is not a substitute for a production worker. MAIL_MAILER=log previews mail without delivering it. Use an HTTPS email API when enabling real delivery on a free instance.

## File storage and reminders

Render Free has no persistent disk. The app currently includes code that needs local paths for document templates and signatures. Before testing document persistence we need to finish private cloud storage support and verify template generation, uploads, authorized downloads and certificate email attachments. Until then local uploads disappear when the instance restarts. The 50 MB runtime upload limit is a testing maximum, not a promise that every field accepts 50 MB.

Scheduled reminders are not guaranteed while the free instance sleeps. No paid worker or disk is requested by this configuration.

## Checks

Local PHP tests, frontend checks and a successful Render Docker build are separate checks. Docker is not installed in the current Windows environment, so the container build must still be verified through Render after database and storage configuration is complete.

## Certificate access troubleshooting

Render Docker secret files can require group 1000 access. The image adds Apache's www-data user to that group and startup validates CA readability and PEM parsing as www-data before starting the app. This does not disable TLS verification or prove that the CA matches the database server. The CA file is excluded from the build context copy; only its runtime mount is used.

## Optional hosted testing accounts

For a separate demo database, set HOSTED_DEMO_ENABLED=true and HOSTED_DEMO_PASSWORD to a private 16–128 character password in Render Environment. Keep APP_ENV=production and APP_DEBUG=false. Set RUN_MIGRATIONS=true for initial provisioning. Startup creates the configured student, student2, adviser, acadcoor, aa, dean and finance @uic.edu.ph demo accounts. All use the chosen testing password; it is never printed. The command refuses to overwrite non-demo users. Repeated starts preserve profiles and records; changing the environment password rotates demo passwords on the next deployment. No Super Admin is created. These are fictional test identities, not school-issued accounts. Do not enable this mode on a database holding real student records. Set HOSTED_DEMO_ENABLED=false and redeploy to disable new demo password logins; already authenticated sessions are not automatically revoked. Google sign-in configuration is separate. Persistent uploads remain unfinished.
