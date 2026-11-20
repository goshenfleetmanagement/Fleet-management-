# Goshen Fleet Management — Project History

This file is the durable project decision and change log. Add a dated entry whenever a feature, requirement, deployment, or important operating decision changes.

## Project overview
- Application: Goshen Fleet Management
- Repository: https://github.com/goshenfleetmanagement/Fleet-management-
- Live application: https://goshenfleetmanagement.github.io/Fleet-management-/
- Frontend: browser-based application in `index.html`
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Purpose: vehicle, driver, journey, mileage, fuel, location and passenger mileage accountability.

## Decisions and history

### 2026-11-20 — Passenger daily mileage sign-off and messaging
- One passenger reviews and signs the **entire daily mileage sheet for one selected vehicle and date**. Do not require a separate signature for every journey.
- The vehicle-specific sheet should show daily journeys, recorded locations, kilometres, opening odometer and closing odometer.
- An authorised administrator or driver prepares a secure passenger review link for the selected vehicle/date.
- **WhatsApp is the chosen sharing channel.** The intended workflow opens WhatsApp with a prepared message and the secure link.
- Retain manual **Copy Link** and QR-code options.
- **SMS integration is not required** unless the owner changes this decision. No SMS provider account or API credentials are needed for this workflow.
- A passenger's sign-off or dispute is one response for that daily sheet. A second response must not replace the first.
- Share only the passenger-scoped link; never expose privileged backend keys.
- The previous conversation reported a WhatsApp-sharing code update and commit `960985e`; verify that commit and live deployment before treating the WhatsApp button as production-confirmed.

### Earlier requirements retained
- Administrators can download a mileage report for **one selected vehicle**, not the whole fleet in one sheet.
- The report should include opening and closing odometer readings, journey locations and distance.
- Driver journey location pins should appear in recorded order from first to last.
- Photo evidence is private and should be accessed using temporary signed links.
- Drivers record journeys and fuel entries; administrators manage fleet records and assignments.

## Change log template
### YYYY-MM-DD — Short change title
- **Request / reason:**
- **Implementation:**
- **Files / database objects changed:**
- **Commit:**
- **Deployment / test result:**
- **Outstanding work:**

## Operational recordkeeping
- Keep this history in Git, not only in chat.
- Record actual commit SHAs and test/deployment outcomes; distinguish completed work from planned work.
- Never commit passwords, Supabase service-role keys, access tokens, private passenger links, or other secrets.
