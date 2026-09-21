# CodeVerity

**AI-powered GitHub repository intelligence.** Paste a repo URL, get a complete audit  architecture review, bug detection, security findings, generated tests, and a quality score  in minutes.

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-active-22d3ee" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue" />
  <img alt="stack" src="https://img.shields.io/badge/stack-React%20%2B%20Node-8b5cf6" />
</p>

---

## What it does

CodeVerity analyzes public (and, on paid plans, private) GitHub repositories using AI and returns a structured engineering report:

- **Architecture review**  how the codebase is put together, with recommendations
- **Bug detection**  logic errors, edge cases, and anti-patterns, with suggested fixes
- **Security analysis**  OWASP-style vulnerability scanning, exposed secrets, dependency CVEs
- **Quality scoring**  code quality, security, performance, and maintainability, rolled into an A–F grade
- **Test generation**  unit tests, edge cases, integration tests, and mocks generated from your actual source
- **Technical debt estimation**  a rough hours-to-fix figure with an itemized breakdown
- **PDF export**  every report can be downloaded and shared

Reports are stored against your account so you can revisit them from **History**; source code itself is processed in memory and never persisted.

## Features

**Core analysis**
- GitHub OAuth + email/password authentication
- Public and private repository scanning (private repos on Pro/Enterprise)
- AI-generated audit reports with health scoring and vulnerability detail
- In-browser Monaco code editor with inline error highlighting and one-click "Fix with AI"
- Full scan history with search, filtering, and sorting

**Team & workspace**
- Multi-member workspaces with role-based access (owner / admin / member / viewer)
- API keys for CI/CD integration
- Scheduled recurring scans (daily / weekly / monthly)
- Slack and Jira integrations, plus generic outbound webhooks
- Usage analytics, quality trends over time, and a full audit log
- Custom branding (logo, brand name, accent colors) per workspace

**Product**
- Tiered pricing (Free / Pro / Team) with monthly and yearly billing, INR and USD
- Stripe-based checkout
- Dark/light theming, compact display mode, and persisted user preferences
- Fully responsive, accessible UI with reduced-motion support throughout

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | React (Vite) |
| Routing | React Router |
| Styling | Tailwind CSS, CSS custom-property theming |
| Animation | GSAP + ScrollTrigger |
| 3D | Three.js |
| Charts | Recharts |
| Code editor | Monaco Editor |
| Icons | Lucide |
| HTTP | Axios |

The frontend theme is entirely token-driven  every color, shadow, and font in the app is a CSS variable defined in `index.css`, so the palette (currently **Slate + Cyan**) can be swapped without touching component code.

## Getting started

### Prerequisites
- Node.js 18+
- A running instance of the CodeVerity API (see your backend repo/service for setup)
- GitHub and/or Google OAuth app credentials, if enabling social login

### Installation

```bash
git clone https://github.com/your-org/codeverity.git
cd codeverity/frontend
npm install
```

### Environment variables

Create a `.env` file in the project root:

```bash
VITE_API_URL=http://localhost:5000/api
```

Point this at your backend's base API URL for local development or production.

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Build for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

## Project structure

```
src/
├── api/                  # Axios-based API clients (auth, github, workspace, report, dashboard, billing)
├── components/
│   ├── Auth/              # AuthLayout, Login, Register, OAuth icons
│   ├── CodeEditor/         # Monaco-based RepoEditor with inline fix suggestions
│   ├── Workspace/          # Invite modal, pending invites, ownership transfer, activity feed
│   ├── CodeInput.jsx        # Single-file code paste & analyze
│   ├── GithubAnalyzer.jsx   # Repo URL analyze flow
│   ├── History.jsx          # Scan history, search/filter/sort
│   ├── Navbar.jsx
│   ├── Result.jsx           # Full report view (audit / full report / tests tabs)
│   ├── ScoreBar.jsx / ScoreChart.jsx
│   └── PricingPlans.jsx     # Shared plan data + price/token formatters
├── context/
│   └── PreferencesContext.jsx  # theme, compact mode, score-bar visibility
├── hooks/
│   └── useToast.js
├── lib/
│   └── gsap.js             # shared GSAP + ScrollTrigger + useGSAP setup
├── pages/
│   ├── Home.jsx             # Landing page (Three.js hero, pricing, FAQ, testimonials)
│   ├── Dashboard.jsx
│   ├── Profile.jsx / Settings.jsx
│   ├── WorkspaceSettings.jsx   # Team/workspace management (members, billing, integrations, etc.)
│   ├── Pricing.jsx / Checkout.jsx
│   ├── Privacy.jsx / Terms.jsx / Support.jsx / Contact.jsx / About.jsx
│   └── ...
├── App.jsx                 # Auth context, providers, route tree
└── index.css                # Design tokens: palette, fonts, animations, global resets
```

## Theming

All visual styling flows from `src/index.css`. Key token groups:

- **Color**  `--accent`, `--accent-secondary`, `--bg-*`, `--text-*`, `--border-*`, and semantic status tokens (`--color-success/info/warning/caution/danger`) each with a `-soft` variant for backgrounds
- **Typography**  `--font-display` (headings), `--font-sans` (body/UI), `--font-mono` (code, labels, terminal-style copy)
- **Shadows**  a `--shadow-xs` → `--shadow-xl` elevation scale
- **Dark/light**  dark is the default (`:root`); light is the explicit opt-in via `[data-theme="light"]`

To retheme the app, edit the token values in `index.css`  components consume tokens exclusively and require no changes.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run linting (if configured) |

## Contributing

1. Fork the repo and create a feature branch
2. Keep new UI consistent with the existing token system  no hardcoded colors
3. Run the app in both dark and light mode, and at a mobile viewport, before opening a PR
4. Open a pull request describing the change and why it's needed

## License

MIT  see `LICENSE` for details.

## Support

- Docs & FAQ: `/support` in the app
- Email: support@codeverity.dev
- Issues: use your repository's issue tracker
