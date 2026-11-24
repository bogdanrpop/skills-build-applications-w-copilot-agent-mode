# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use one shared capability component for API loading, empty, success, and accessible error states, with each route responsible for displaying its own response shape.
- Logic tier decision: Keep request validation and capability behavior in explicit service functions; return deliberate 4xx responses for malformed input and missing records.
- Data tier decision: Enforce required fields and basic numeric constraints in Mongoose schemas, and preserve the existing non-destructive, idempotent seed process.
- Activity tracking approach: Validate IDs, type, and positive whole minutes; require existing user and team records; award one point per minute and timestamp the created activity.
- Team management approach: Require a name and mascot, default members to an empty list, and validate member IDs before creating a team.
- Leaderboard approach: Sum activity points by team, include teams with no activity at zero points, sort descending with a stable name tie-break, and assign 1-based ranks.
- Workout suggestions approach: Look up the user by email, prefer workouts matching their goal and then recent activity, return a reason with each suggestion, and return an empty list if no available workout matches; return 404 for an unknown email.

## Test plan

Run the narrow contract suites first, then the full suites and builds. A failure in a contract suite identifies a broken tier boundary; a build failure identifies a TypeScript or production-bundling issue.

- `npm run test:data --prefix octofit-tracker/backend` — passed (5 tests); verifies model validation and non-destructive, idempotent seeding.
- `npm run test:api --prefix octofit-tracker/backend` — passed (5 tests); verifies input handling, persistence, leaderboard, and workout recommendations.
- `npm test --prefix octofit-tracker/frontend` — passed (15 tests); verifies route data and accessible loading, empty, and error states.
- `npm test --prefix octofit-tracker/backend` — passed (10 tests); confirms the complete backend contract suite.
- `npm run build --prefix octofit-tracker/backend` — passed; type-checks backend source and tests.
- `npm run build --prefix octofit-tracker/frontend` — passed; type-checks and produces the Vite production bundle.
