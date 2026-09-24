# CodeVerity

**AI-powered GitHub repository intelligence paste a repo URL, get a complete audit: architecture review, bug detection, security findings, generated tests, and a quality score, in minutes.**

<p align="center">
  <img src="https://img.shields.io/badge/status-active-22d3ee" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/stack-React%20%2B%20Node-8b5cf6" alt="Stack" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node" />
</p>

---

## What it does

CodeVerity is a full-stack monorepo. It analyzes public (and, on paid plans, private) GitHub repositories using AI and returns a structured engineering report:

- Architecture review  how the codebase is put together, with recommendations
- Bug detection logic errors, edge cases, anti-patterns, with suggested fixes
- Security analysis OWASP-style vulnerability scanning, exposed secrets, dependency CVEs
- Quality scoring code quality, security, performance, maintainability, rolled into an A–F grade
- Test generation unit tests, edge cases, integration tests, mocks generated from actual source
- Technical debt estimation  hours-to-fix figure with an itemized breakdown
- PDF export  every report can be downloaded and shared

Source code is processed in memory and never persisted. Reports are stored against the user's account and revisitable from History.

---

## Features

### Core analysis
- GitHub OAuth + email/password authentication
- Public and private repo scanning (private on Pro/Enterprise)
- AI-generated audit reports with health scoring and vulnerability detail
- In-browser Monaco code editor with inline error highlighting and one-click "Fix with AI"
- Full scan history with search, filtering, sorting

### Auto-Fix
- AI-generated pull requests one click on a finding opens a PR with a surgical, file-level fix
- PR review comments post critical/high-severity findings as inline GitHub review comments
- Test generation generate test cases for any file from the report view

### Team & workspace
- Multi-member workspaces with role-based access (owner / admin / member / viewer)
- API keys for CI/CD integration
- Scheduled recurring scans (daily / weekly / monthly)
- Slack and Jira integrations plus generic outbound webhooks
- Usage analytics, quality trends over time, full audit log
- Custom branding (logo, brand name, accent colors) per workspace

### Product
- Tiered pricing (Free / Pro / Team) with monthly and yearly billing, INR and USD
- Stripe-based checkout
- Dark/light theming, compact display mode, persisted user preferences
- Fully responsive, accessible UI with reduced-motion support

---

## Tech stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router v6 |
| Styling | Tailwind CSS + CSS custom-property theming |
| Animation | GSAP + ScrollTrigger |
| 3D | Three.js (hero 3D) |
| Charts | Recharts |
| Code editor | Monaco Editor |
| Icons | Lucide |
| HTTP client | Axios |
| Notifications | react-hot-toast |
| Error tracking | Sentry |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js (>= 18) |
| Framework | Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt; HttpOnly cookies for OAuth flows |
| OAuth providers | GitHub OAuth Apps + Google OAuth 2.0 |
| AI inference | Groq API |
| GitHub API | @octokit/rest |
| Rate limiting | express-rate-limit |
| Billing | Stripe |
| Scanners | Custom modules  secrets, dependencies, CVEs, complexity, README quality |

---

## Architecture
codeverity/
├── backend/
│ ├── controllers/ (authController, githubController, reportController, workspaceController)
│ ├── middleware/ (auth, rate limiters, error handlers)
│ ├── models/ (User, Report, WorkSpace)
│ ├── routes/ (Express routers)
│ ├── utils/ (groq, scanners, complexity, cve, readmeQuality, githubParser, githubPRComments)
│ └── index.js
└── frontend/
├── src/
│ ├── api/ (axios clients for auth, github, workspace, report, dashboard, billing)
│ ├── components/ (Auth/, CodeEditor/, Workspace/, CodeInput, GithubAnalyzer, History, Navbar, Result, ScoreBar, ScoreChart, PricingPlans)
│ ├── context/ (PreferencesContext theme, compact mode, score-bar visibility)
│ ├── hooks/ (useToast, useAuth)
│ ├── lib/ (gsap setup)
│ ├── pages/ (Home, Dashboard, Profile, Settings, WorkspaceSettings, Pricing, Checkout, Privacy, Terms, Support, Contact, About, AdminDashboard, OAuthSuccess)
│ ├── App.jsx
│ └── index.css (design tokens)
└── vite.config.js

### Request flow  Repository analysis

Client --POST /api/github/analyze--> Express
Express: clone+parse repo, run static scanners in parallel, call Groq for AI review,
normalize into findings[], compute health score + tech debt, persist Report to MongoDB
Client <--{ analysis, reportId }--


### Request flow  Auto-Fix

Client --POST /api/github/auto-fix--> Express
Express: verify GitHub token, fetch file via Octokit, ask Groq to regenerate the file,
create branch + commit + PR, write audit log
Client <--{ prUrl, prNumber }--


---

## Getting started

### Prerequisites
- Node.js >= 18
- MongoDB >= 6 (local or Atlas)
- GitHub OAuth App
- Google OAuth Client
- Groq API key

### 1. Clone

```bash
git clone https://github.com/your-org/codeverity.git && cd codeverity
```

### 2. Install

```bash
cd backend && npm install; cd ../frontend && npm install
```

### 3. Configure env

Create `backend/.env` and `frontend/.env` from the templates in [Environment variables](#environment-variables).

### 4. Run dev

```bash
# terminal 1  backend (port 5000)
cd backend && npm run dev
```

```bash
# terminal 2  frontend (port 5173)
cd frontend && npm run dev
```

### 5. Production

```bash
# backend
NODE_ENV=production node index.js
```

```bash
# frontend
npm run build && npm run preview
```

---

## Environment variables

### backend/.env

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Required | `development` \| `production` |
| `PORT` | Optional | Defaults to `5000` |
| `MONGO_URI` | Required | MongoDB connection string |
| `JWT_SECRET` | Required | >= 32 random bytes; must be stable across deploys |
| `ENCRYPTION_KEY` | Required | 32-byte hex key for encrypting GitHub tokens at rest |
| `FRONTEND_URL` | Required | Frontend origin |
| `BACKEND_URL` | Required | Backend origin |
| `GITHUB_CLIENT_ID` | Required | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Required | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | Required | Must match GitHub OAuth App settings |
| `GOOGLE_CLIENT_ID` | Required | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Required | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Required | Must match Google OAuth credentials |
| `GROQ_API_KEY` | Required | Groq API key |
| `STRIPE_SECRET_KEY` | Required | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Required | Stripe webhook signing secret |
| `SENTRY_DSN` | Optional | Sentry ingestion DSN |

### frontend/.env

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Required | Backend API base, e.g. `http://localhost:5000/api` |
| `VITE_SENTRY_DSN` | Optional | Sentry ingestion DSN |

Generate secrets (`JWT_SECRET`, `ENCRYPTION_KEY`):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Project structure (frontend)
frontend/
├── src/
│ ├── api/ (axios clients for auth, github, workspace, report, dashboard, billing)
│ ├── components/ (Auth/, CodeEditor/, Workspace/, CodeInput, GithubAnalyzer, History, Navbar, Result, ScoreBar, ScoreChart, PricingPlans)
│ ├── context/ (PreferencesContext  theme, compact mode, score-bar visibility)
│ ├── hooks/ (useToast, useAuth)
│ ├── lib/ (gsap setup)
│ ├── pages/ (Home, Dashboard, Profile, Settings, WorkspaceSettings, Pricing, Checkout, Privacy, Terms, Support, Contact, About, AdminDashboard, OAuthSuccess)
│ ├── App.jsx
│ └── index.css (design tokens)
└── vite.config.js


---

## API reference

All routes are under `/api`. Protected routes require `Authorization: Bearer <jwt>`.

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create an account |
| POST | `/login` | Public | Password login |
| POST | `/logout` | Public | Clear the auth cookie |
| GET | `/me` | Auth | Current user + `hasGithubConnected` |
| PUT | `/profile` | Auth | Update name / email |
| PUT | `/password` | Auth | Change password |
| DELETE | `/account` | Auth | Delete account and all data |
| GET | `/google` | Public | Start Google OAuth |
| GET | `/google/callback` | Public | Google OAuth callback |
| GET | `/github` | Public | Start GitHub OAuth (`?connect=true` to link) |
| GET | `/github/callback` | Public | GitHub OAuth callback |
| DELETE | `/github` | Auth | Disconnect GitHub |

### GitHub (`/api/github`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/analyze` | Auth | Analyze a repository |
| GET | `/repo-contents` | Auth | List a directory in a repo |
| GET | `/file-content` | Auth | Fetch a single file |
| POST | `/auto-fix` | Auth | Open a PR with an AI-generated fix |
| POST | `/comment-pr` | Auth | Post findings as PR review comments |
| POST | `/generate-tests` | Auth | Generate tests for a snippet |

### Reports (`/api/report`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:id` | Auth | Fetch a single report |
| GET | `/` | Auth | List the user's reports |
| DELETE | `/all` | Auth | Delete all reports |

### Error shape

All endpoints return JSON on error:

```json
{
  "error": "Your GitHub connection has expired. Please reconnect GitHub in Settings.",
  "action": "connect_github"
}
```

The optional `action` field lets the frontend prompt the user for remediation without parsing the message.

---

## Theming

The frontend theme is token-driven. All visual styling flows from `src/index.css`. Key token groups:

- Color: `--accent`, `--accent-secondary`, `--bg-*`, `--text-*`, `--border-*`, semantic status tokens (`--color-success` / `info` / `warning` / `caution` / `danger`), each with a `-soft` variant for backgrounds
- Typography: `--font-display` (headings), `--font-sans` (body/UI), `--font-mono` (code, labels, terminal-style copy)
- Shadows: `--shadow-xs` through `--shadow-xl` elevation scale
- Dark/light: dark is default (`:root`); light is opt-in via `[data-theme="light"]`

To retheme, edit token values in `index.css`  components consume tokens exclusively and require no changes.

---

## Deployment

### Backend  Render

1. Create a Web Service pointing at `backend/`
2. Build command: `npm install`
3. Start command: `node index.js`
4. Add all backend env vars
5. Set `NODE_ENV=production` so cookies are flagged `Secure`
6. If behind a proxy/LB (Render, Fly, Cloudflare), set `app.set("trust proxy", 1)` so `express-rate-limit` keys on real client IPs

### Frontend  Vercel/Netlify

1. Root directory: `frontend/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_URL` to the deployed backend
5. Add the deployed frontend origin to GitHub + Google OAuth callback settings

### Post-deploy checklist

- [ ] GitHub OAuth callback URL updated to production
- [ ] Google OAuth credentials updated to production
- [ ] `FRONTEND_URL` and `BACKEND_URL` point at production
- [ ] `JWT_SECRET` and `ENCRYPTION_KEY` are stable (rotating logs out all users and invalidates stored GitHub tokens)
- [ ] `NODE_ENV=production` set on backend
- [ ] MongoDB Atlas network access allows backend host

---

## Security

- GitHub tokens at rest: AES-256-GCM using `ENCRYPTION_KEY` before persisting
- Session cookies: HttpOnly, SameSite=Lax, Secure in production
- CSRF protection on OAuth: random state written to HttpOnly cookie and verified on callback
- Password hashing: bcrypt cost factor 10
- Constant-time login: bcrypt runs even for unknown emails to prevent user enumeration via timing
- Rate limiting: strict on `/login` and `/register` (10 / 15 min / IP); moderate on OAuth start routes (30 / 15 min / IP)
- Path traversal guards: all user-supplied file paths normalized and rejected if absolute or containing `..`
- GitHub OAuth scope is `repo user:email` only  nothing broader

### Rotating ENCRYPTION_KEY

Do not rotate `ENCRYPTION_KEY` without a migration. Existing encrypted GitHub tokens will fail to decrypt, and users see "GitHub token required" until they reconnect. If rotation is required:

1. Keep the old key available
2. Add a migration script that decrypts every user's token with the old key and re-encrypts with the new one
3. Deploy the migration, then swap the key

---

## Scripts (frontend)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run linting (if configured) |

---

## Contributing

1. Fork and create a feature branch: `git checkout -b feat/your-feature`
2. Keep new UI consistent with the existing token system  no hardcoded colors
3. Test in dark and light mode and at a mobile viewport before opening a PR
4. Ensure `npm run lint` and `npm run build` pass in both `backend/` and `frontend/`
5. Open a PR describing the change and why it's needed

### Conventions

- Commits: Conventional Commits
- Formatting: Prettier defaults; run `npm run format` before committing
- Tests: required for new scanners and any change to the findings pipeline

### Reporting bugs

Open an issue with steps to reproduce, expected vs actual, browser/Node version, and any console/network output. For security issues, do not open a public issue  email maintainers directly.

---

## License

MIT  see [LICENSE](./LICENSE) for details.

---

## Support

- Docs & FAQ: `/support` in the app
- Email: support@codeverity.dev
- Issues: use your repository's issue tracker

---

<p align="center">
  <strong>CodeVerity</strong><br />
  AI-powered GitHub repository intelligence  paste a repo URL, get a complete audit in minutes.<br />
  Built with ❤️ for developers who care about their code.
</p>
