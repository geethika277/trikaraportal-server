# Trikara Portal

Full-stack agency portal with CRM, project management, GitHub integration, and invoicing.

## Project Structure

```
trikara-portal/
├── package.json        ← workspace root (coordinator)
├── package-lock.json
├── node_modules/       ← ALL dependencies live here (shared)
├── client/             ← React frontend (Vite)
│   └── package.json
└── server/             ← Express backend (Node.js)
    └── package.json
```

This project uses **npm workspaces** — a monorepo setup where `client/` and `server/` are separate packages that share a single `node_modules/` at the root.

### If you're used to managing client and server separately

You might expect to `cd server && npm install` or `cd client && npm install`. **Don't do that here.** Instead:

| Old way | Workspace way |
|---|---|
| `cd server && npm install` | `npm install` (from root) |
| `cd client && npm install` | `npm install` (from root) |
| `cd server && npm install express` | `npm install express --workspace=server` |
| `cd client && npm install react-query` | `npm install react-query --workspace=client` |
| `cd server && npm run dev` | `npm run dev --workspace=server` |
| `cd client && npm run dev` | `npm run dev --workspace=client` |

Always run `npm` commands from the **root directory**.

### Why one `node_modules/`?

npm hoists shared dependencies to the root so they're installed once instead of duplicated in each subfolder. For example, `zod` is used by both client and server — it only exists in `node_modules/` once. Node resolves imports from there automatically.

## Getting Started

```bash
# Install all dependencies (client + server)
npm install

# Run both client and server in parallel
npm run dev

# Run only the server
npm run dev --workspace=server

# Run only the client
npm run dev --workspace=client

# Seed the database
npm run seed
```

## Stack

**Frontend** (`client/`) — React 19, Vite, Tailwind CSS, Radix UI, TanStack Query, React Router, Zustand, Socket.io-client

**Backend** (`server/`) — Express 5, MongoDB (Mongoose), Socket.io, JWT auth, Zod validation, Octokit (GitHub API)
