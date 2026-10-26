# ScamSense

## Problem statement

Students and early-career job seekers can receive convincing internship or job offers that ask for fees, pressure them to act, or hide who is contacting them. It can be difficult to assess a message quickly, especially when the warning signs are embedded in a long job description or recruiter email.

## Target users

ScamSense is built for students, graduates, and early-career job seekers who want a second look at an internship or job opportunity before responding.

## Solution

ScamSense evaluates the text the user provides against a transparent set of recruitment-fraud signals. It shows a score, risk label, matched phrases, and explanations, and may add basic domain context for links and email addresses. Signed-in users can revisit their saved checks in History.

> ScamSense is an evidence aid, not a guarantee or a substitute for independently verifying an employer. A low score does not prove an offer is legitimate.

## Features

- Paste full job descriptions, recruiter messages, emails, and offers for analysis.
- See a 0–100 signal score, risk label, matched text, explanations, and practical next steps.
- Extract email addresses, phone numbers, links, money amounts, and a best-guess company name.
- Check available email-domain MX records and registration dates when a domain or URL is present.
- Register and sign in with bcrypt-hashed passwords and an httpOnly JWT cookie.
- Save authenticated analyses and view them in History.
- Submit a community report.
- Use a responsive interface with landing, analysis, authentication, History, and report pages.

## Technology

- **Frontend:** React, TypeScript, Vite, React Router
- **Backend:** Node.js, Express (ES modules)
- **Database:** MongoDB with Mongoose
- **Authentication:** bcrypt and JWT stored in an httpOnly cookie
- **Validation and tests:** Zod, Vitest, Supertest

## Architecture

```text
React + TypeScript (Vite)
  ├── Registration, login, analyzer, history, and report pages
  └── Requests to /api (Vite proxy in development; VITE_API_BASE_URL in deployment)
          ↓
Express API
  ├── Zod validation, error handling, rate limiting, and JWT-cookie authentication
  ├── Signal engine and entity extraction
  ├── Optional DNS MX and RDAP domain lookups
  └── Mongoose persistence
          ↓
MongoDB
  ├── Users (bcrypt password hashes)
  ├── Per-user saved analyses
  └── Community reports
```

The signal engine runs locally in the Express service; analysis does not depend on a paid LLM API. Domain intelligence is an optional external lookup and may be unavailable. The browser holds the session in an httpOnly cookie; protected API routes use the verified JWT identity to scope saved data.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- MongoDB, available locally or through a MongoDB connection URI

## Run locally

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Configure the API

Create a local server environment file:

```bash
cp server/.env.example server/.env
```

Set `JWT_SECRET` in `server/.env` to a long, random value. For example, generate one with:

```bash
openssl rand -hex 32
```

The example configuration uses a local MongoDB database named `scamsense`. Change `MONGODB_URI` if your MongoDB instance uses another address or database.

```dotenv
PORT=5000
MONGODB_URI=mongodb://localhost:27017/scamsense
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
```

Keep `server/.env` private. Do not commit secrets or use the example value as a production secret.

### 3. Start MongoDB

Make sure the MongoDB server referenced by `MONGODB_URI` is running before starting the API.

### 4. Start the API and frontend

Open two terminals at the repository root.

**Terminal 1 — API:**

```bash
npm run server:dev
```

The API connects to MongoDB and listens on the configured `PORT` (5000 by default).

**Terminal 2 — frontend:**

```bash
npm run client:dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The Vite development server proxies `/api` requests to the API port configured in `server/.env`.

If Vite selects a different port because 5173 is already occupied, set `CLIENT_ORIGIN` in `server/.env` to the frontend's actual origin and restart the API. If you change the API port, keep the Vite proxy and API configuration in sync.

### 5. Create an account and analyse an offer

1. Select **Create account**, enter an email and a password of at least eight characters, and submit.
2. Registration signs you in automatically. You can also use **Sign in** for an existing account.
3. Paste the complete offer or message into the analysis form and select **Analyse offer**.
4. Review the score, matched signals, domain details (when available), and verification limitations.
5. Open **History** to view saved analyses. Use **Logout** to end the browser session.

Analysis is an authenticated feature because results are saved to the signed-in user's history.

## How analysis works

The API's deterministic signal engine currently checks for:

- Requests for fees, payments, transfers, cryptocurrency, or account details
- Pressure to act urgently
- Sender addresses from common free-mail providers
- WhatsApp- or Telegram-only contact without an extracted phone number or email
- Guaranteed selection or selection without an interview
- Known URL-shortening services
- A mismatch between the extracted sender email domain and a best-guess company name
- Monetary amounts above the engine's configured threshold

Matched signals contribute weighted points. The total is capped at 100 and mapped to **Low** (0–33), **Medium** (34–66), or **High** (67–100). These are heuristic indicators, not verified facts about an employer or offer. A signal may also miss context or match an innocent phrase; review the original message and verify through the company's official channels.

When a URL or sender email domain is available, the server attempts an MX-record lookup and a domain-registration lookup through RDAP. These lookups can be unavailable or inconclusive and do not establish that a recruiter or company is genuine.

## API overview

All routes are served under `/api`. Protected routes require the JWT cookie created at registration or login.

| Method | Path | Description | Authentication |
|---|---|---|---|
| `GET` | `/api/health` | API health check | No |
| `POST` | `/api/auth/register` | Create an account and start a session | No |
| `POST` | `/api/auth/login` | Sign in and start a session | No |
| `POST` | `/api/auth/logout` | Clear the session cookie | No |
| `GET` | `/api/user` | Get the signed-in user | Yes |
| `POST` | `/api/analysis/analyze` | Analyse and save offer text | Yes |
| `GET` | `/api/history` | List the user's saved analyses | Yes |
| `GET` | `/api/history/reports` | List the user's community reports | Yes |
| `POST` | `/api/reports` | Submit a community report | Yes |

Example analysis request body:

```json
{
  "text": "Paste the job description, email, or offer here."
}
```

The analysis response includes `score`, `riskLevel`, `evidence`, `entities`, `domainInfo`, and `analysisId`.

## Development checks

Run the existing backend tests:

```bash
npm test
```

Build and type-check the frontend:

```bash
npm run build
```

Lint the frontend:

```bash
npm --workspace=client run lint
```

## Deploy to Vercel and Render

The repository includes a Render Blueprint for the Express API (`render.yaml`) and a Vercel configuration for the Vite single-page frontend (`vercel.json`).

**Deployment status:** deployment is not yet confirmed. Add the public frontend URL and API health URL here after provisioning and verifying the hosting services. Do not submit placeholder URLs as live links.

1. Push the repository to GitHub, then create a **MongoDB Atlas** database. Allow the Render service to connect to the Atlas cluster, and copy the database connection URI.
2. In Render, create a Blueprint instance for this repository. Set `MONGODB_URI` to the Atlas URI and `CLIENT_ORIGIN` to the exact deployed Vercel origin (for example, `https://your-project.vercel.app`). Render generates `JWT_SECRET` for the API. Do not expose these values in source control.
3. In Vercel, import the same repository. Keep the project root at the repository root so the workspace build command works. Set `VITE_API_BASE_URL` to the Render API origin (for example, `https://scamsense-api.onrender.com`), without a trailing slash, for Production and any other deployment environments you use.
4. Deploy the Vercel frontend, then set its exact origin in Render's `CLIENT_ORIGIN` environment variable and redeploy/restart the API if needed.
5. Verify the API health endpoint at `https://<render-service>.onrender.com/api/health`, then test account registration, login, analysis, history, and logout on the deployed Vercel URL.

The production API uses secure cross-site cookies, so the Vercel frontend sends requests with credentials and the API must return credentialed CORS headers for the configured `CLIENT_ORIGIN`. Use HTTPS for both services. If you use a custom frontend domain, update `CLIENT_ORIGIN` to that exact origin.

Provisioning Vercel, Render, and Atlas resources and setting their secrets require access to those accounts; do not commit production credentials to the repository.

## Project layout

```text
client/
  src/
    components/  Navigation
    context/     Authentication state
    pages/       Landing/analyzer, login, registration, history, reports
    theme.css    ScamSense color tokens
server/
  src/
    config/      MongoDB connection
    controllers/ HTTP request handlers
    middleware/  Authentication, rate limits, and error handling
    models/      User, analysis, and report schemas
    routes/      Express API routes
    services/    Signal engine, extraction, and domain intelligence
```

## Demo video script (about 3–4 minutes)

**[Show the landing page]**

“Hi, I’m [your name], and this is ScamSense. Students and early-career job seekers often receive job messages that are difficult to verify. ScamSense gives them a second look by identifying specific warning signs in the text and explaining what was matched. It helps with verification; it does not claim to prove an offer is genuine or fraudulent.”

**[Briefly show the landing page and navigation]**

“The main workflow is to create an account, review an offer, inspect the evidence, and revisit saved checks in History. Reports are also available for sharing community information.”

**[Open Create account, register with a demo email, then return to the analyzer]**

“I’ll register with a demo account. Passwords are hashed by the server, and the signed-in session uses an httpOnly cookie. Analyses are saved under this account.”

**[Paste a representative Java/Spring Boot/React job description and analyse it]**

“Here is a typical software role. ScamSense returns a score and risk label, shows which known signals matched, and provides context. No matched signals only means this text did not trigger the current checks; it does not verify the employer.”

**[Replace the text with a suspicious fee request that also creates urgency and guarantees selection; analyse it]**

“This message asks for an upfront fee, pressures the applicant to act immediately, and claims selection without an interview. The result highlights the matched phrases and explains each signal so the user can see why the score changed. The score is a deterministic heuristic, not a certainty.”

**[Scroll to evidence and domain details]**

“When the text contains a link or email domain, ScamSense may show basic DNS and registration details. Those checks can be unavailable and cannot establish that a recruiter is authorized to represent a company.”

**[Open History, then log out]**

“The completed checks appear in this account’s History. I can log out when I’m finished. Before paying or sharing personal information, I would contact the employer through independently verified official channels.”

**[End on the landing page or deployed app URL]**

“That’s ScamSense: evidence to guide a more careful next step. Thank you.”

**Recording checklist:** use a demo account and non-sensitive offer text; show the actual result and History; avoid displaying secrets, personal messages, or real private contact details. Replace `[your name]` and add the verified public app URL after deployment.
