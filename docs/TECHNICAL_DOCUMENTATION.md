# Goshen Fleet Management — Technical Documentation

Last reviewed: 2026-11-20

## 1. System overview
Goshen Fleet Management is a browser-based fleet field-management application.

| Layer | Technology / location |
|---|---|
| Frontend | HTML, CSS and JavaScript in `index.html` |
| Hosting | GitHub Pages |
| Source control | `goshenfleetmanagement/Fleet-management-` |
| Database and backend | Supabase project `cpfippqprzmjdqzwnwyg` |
| Authentication | Supabase Auth |
| File evidence | Supabase Storage (private bucket; signed URLs) |
| Server-side operations | Supabase Edge Functions |
| Map display | Leaflet |
| Passenger QR code | QRCode.js |

## 2. Environments and links
- Repository: https://github.com/goshenfleetmanagement/Fleet-management-
- Production website: https://goshenfleetmanagement.github.io/Fleet-management-/
- Supabase project URL: https://cpfippqprzmjdqzwnwyg.supabase.co
- Supabase project reference: `cpfippqprzmjdqzwnwyg`
- Region: `eu-west-1`
- Last reported project status: `ACTIVE_HEALTHY`

The frontend uses a Supabase **publishable/anon** client key. It is intended for browser use, but database Row Level Security (RLS) must enforce access. Never put a service-role key or privileged secret in frontend code, documentation, or Git history.

## 3. Frontend structure
The current application is a single-page interface in `index.html`. Main sections observed in source:
- Dashboard
- Journeys
- Fuel records
- Vehicles (administrator)
- Drivers (administrator)
- Assignments (administrator)
- Passenger mileage sign-off
- Reports (administrator)
- Photo evidence (administrator)
- Driver locations (administrator)
- Settings

The app stores public Supabase connection configuration in browser local storage. Authentication and data access use the Supabase JavaScript client. External browser libraries referenced include Supabase JS v2, Leaflet 1.9.4 and QRCode.js 1.0.0.

## 4. Backend and data
The app uses Supabase PostgreSQL, Auth, Storage and Edge Functions. Source code references these data objects (confirm live definitions before migrations or changes):
- `vehicles`
- driver profile records
- `driver_vehicle_assignments`
- `journeys`
- `fuel_records`
- journey location-point records
- passenger mileage sign-off and audit records

This list may not be exhaustive and is not a substitute for inspecting the live schema.

### Edge Functions
- `smooth-action`: referenced by the frontend for driver account-related operations.
- `passenger-mileage-signoff`: creates a daily vehicle sign-off snapshot and supports passenger view, sign and dispute actions. Last reported deployment: active version 1, `verify_jwt=false`; the function performs action-specific checks. Re-check deployed code and policies before changing authentication behaviour.

### Passenger sign-off flow
1. An authorised administrator or driver selects one vehicle and one mileage date.
2. The backend prepares a snapshot of completed journeys and associated route/location information for that vehicle/date.
3. The backend generates a high-entropy passenger token; store only a token hash server-side where implemented.
4. The passenger opens the review URL using the token and views the daily snapshot.
5. The passenger submits one response: sign or dispute, with passenger details/signature or dispute comment.
6. The backend accepts a response only while the record is pending, preventing a later response from overwriting the first.
7. The resulting sign-off is available to the authorised reporting workflow.

The sign-off is **one passenger response per vehicle/day sheet**, not one response per journey.

### Messaging decision
The approved sharing approach is a WhatsApp share action that opens a prepared message containing the secure passenger link. Retain copy-link and QR options. SMS delivery is out of scope by owner decision dated 2026-11-20. Confirm WhatsApp implementation in source and production before marking it production-verified.

## 5. Security and privacy requirements
- Enforce least-privilege access with Supabase RLS on every exposed table.
- Hidden frontend navigation is not an authorisation boundary.
- Keep service-role keys and privileged credentials only in server-side secrets.
- Passenger tokens must be unguessable, scoped to the intended daily sheet, and protected against replay or duplicate responses.
- Do not put passenger tokens in public logs, analytics, issue descriptions, screenshots or repository documentation.
- Keep photo evidence in private storage and use short-lived signed URLs.
- Validate input and verify user role and vehicle/driver assignment server-side.
- Use HTTPS for the app and passenger links.

## 6. Build, deployment and verification
The site is published through GitHub Pages. The deployment workflow is under `.github/workflows/`; inspect the active workflow before changing deployment configuration.

After changes:
1. Review the diff and ensure no secrets or private data were added.
2. Commit to the intended branch.
3. Confirm GitHub Actions completes successfully.
4. Open the production URL and verify the feature on a real device/browser.
5. For backend changes, inspect Edge Function logs and relevant database records; test authorised and unauthorised cases.
6. Record commit SHA, workflow run and observed test result in `docs/PROJECT_HISTORY.md`.

A successful commit does not prove the Pages deployment or a Supabase operation succeeded.

## 7. Recovery and backup
The repository is the source of truth for application source and documentation. A scheduled GitHub Actions workflow creates a Git bundle and source archive as downloadable Actions artifacts. This is a convenience backup, not an independent backup.

A Git bundle does **not** back up Supabase database data, Storage objects, Auth users, Edge Function secrets or project configuration. Arrange separate Supabase database and Storage backups, and securely preserve required configuration outside Git. Never export secrets into the repository.

See `.github/workflows/repository-backup.yml`. Check artifact retention and periodically download a backup to independent storage.

## 8. Maintenance checklist
- [ ] Update project history when requirements change.
- [ ] Record production code/backend changes and their commit.
- [ ] Confirm GitHub Pages deployment after frontend changes.
- [ ] Test sign-in, role permissions, journey recording and reporting after relevant changes.
- [ ] Test passenger invalid-token handling and duplicate sign-off prevention.
- [ ] Test WhatsApp sharing on mobile, plus copy-link and QR fallback.
- [ ] Confirm RLS and Edge Function authorisation after backend changes.
- [ ] Confirm repository backup artifacts are generated.
- [ ] Maintain independent Supabase database and Storage backups.
- [ ] Keep credentials and passenger data out of Git.
