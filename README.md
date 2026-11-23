# MyTutorly

MyTutorly is a React and Vite university prototype for studying from course materials. The included Database Systems workspace demonstrates course organization, source-referenced tutoring, a guided lesson, and study progress.

## Run locally

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Run `npm run lint` to check the code and `npm run build` to create the production bundle in `dist/`. Use `npm run preview` to serve that bundle locally.

## Demo walkthrough

1. On the landing page, select **See how it works**, then **Explore course materials**. Choose a sample file to show the simulated upload states.
2. Select **Ask Ollie** and try **Explain 2NF step by step**. Open the Lecture 04 reference to show the source preview.
3. Open **Study** and work through the explanation, worked example, knowledge check, and practice exercise. Select **See your progress** on completion.
4. Open **Settings** to show how explanation length and information density affect the sample lesson.

The app uses seeded course content and local React state. Uploads are simulated and do not parse file contents. Tutor responses and source previews use sample data. The optional checkout demonstration does not collect payment.

## Focus Mode and Study Leaderboards

Use Node.js 22.13 or later. The Vite development and preview servers include the same-origin study API. Open **Focus Mode** or **Leaderboards** from the workspace sidebar to start without signing in. MyTutorly assigns a username and uses a browser cookie to reconnect to the saved study profile. Clearing cookies or switching browsers starts a new profile. The sample course and its student profile continue to use the prototype's existing state.

Study accounts, sessions, friend requests, and the point ledger are stored in SQLite at `.local/study.sqlite`. Set `TUTORLY_DB` to a durable database path when hosting. Use HTTPS and set `TUTORLY_SECURE_COOKIE=1` behind an HTTPS proxy. A static-only deployment needs a Node host for the study API. A Node host can mount `createStudyApi` from `server/api.mjs` before serving the Vite build. Preserve the public Host header when forwarding requests.

A visible, focused tab sends a confirmation about every four seconds. The server credits its own elapsed time up to the session target, with one unfinished session per account. A 12-second gap expires the timer's connection and leaves the unconfirmed interval uncredited. Users can reconnect and resume from their last confirmed total. Detected focus losses pause the session and deduct 10 points when the event reaches the server. Sudden disconnects or browser termination can prevent delivery. Browser signals are best-effort and cannot prove that somebody is studying.

Search and friend requests require the recipient to opt in to exact-username discovery. Accepted friends can see each other's lifetime scores. Institution scores are visible only to opted-in members of the same verified institution. An operator should independently verify affiliation against institutional records or an existing approved process before running the following command against the same database. Use one canonical school name for all members of the institution.

```sh
npm run verify-school -- username "Canonical School Name"
npm run verify-school -- username --revoke
```

Verification and revocation reset the student's sharing preference. Students opt in from **Leaderboards** after verification.

Run `npm test` for scoring, session ownership and replay handling, friend permissions, and school sharing checks.

## Host on Vercel

Link this directory to the MyTutorly Vercel project. Connect a Turso database from
the Vercel Marketplace to the Production environment. The integration sets
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for the server. Keep both variables
server-side. Use a separate database if preview deployments need working study features.

Deploy with `vercel deploy --prod`. Vercel serves the Vite build and routes
`/api/study/*` to the study function. The first request initializes the database
schema. Check `/api/study/me` on the deployment for a JSON response, then open
`/?view=focus` and `/?view=leaderboards` to verify a browser profile can use the API.

Hosted profiles start in the connected Turso database. The local `.local`
directory is excluded from deployment. To verify a hosted profile's school,
run the existing verification command with the hosted database URL and token
available as environment variables.
