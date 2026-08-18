# ServiceWatch

A lightweight service health monitoring dashboard. Add any HTTP endpoint you
want to keep an eye on, and ServiceWatch periodically checks it, records
uptime and response time history, and flags it when it goes down.

## Features

- Add/remove services to monitor by URL
- Automatic health checks every 30 seconds (configurable)
- Uptime percentage and response time tracking per service
- Console alerting when a service check fails
- Zero external dependencies for storage — uses a simple JSON file store, so
  there's nothing extra to install or configure to run it locally

## Tech Stack

**Backend:** Node.js, Express
**Frontend:** React, Vite

## Project Structure

```
servicewatch/
├── backend/
│   ├── src/
│   │   ├── server.js      # Express app + REST API routes
│   │   ├── monitor.js     # Periodic health-check engine
│   │   └── store.js       # JSON file-based data store
│   └── data/               # Auto-created: services.json, history.json
└── frontend/
    └── src/
        ├── App.jsx         # Dashboard UI
        └── App.css
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm start
```

Runs on `http://localhost:4000`. On first run, it seeds a few default
services (GitHub, GitHub API, Google) so the dashboard has real data
immediately.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and talks to the backend API.

## API

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/services` | List all services with current status, response time, and uptime % |
| POST | `/api/services` | Add a new service (`{ name, url }`) |
| DELETE | `/api/services/:id` | Remove a service |
| GET | `/api/services/:id/history` | Get check history for a service |

## How It Works

A background interval (`monitor.js`) pings every registered service on a
fixed schedule using the native `fetch` API with an abort-based timeout.
Each check result (status, HTTP status code, response time) is appended to a
per-service history log, capped at the last 200 checks to keep the file
size bounded. Uptime percentage is computed on read as the ratio of
successful checks over the retained history window.

## License

MIT
