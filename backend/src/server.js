const express = require("express");
const cors = require("cors");
const store = require("./store");
const { startMonitor, CHECK_INTERVAL_MS } = require("./monitor");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

store.ensureDataFiles();

// Seed a few default public services on first run so the dashboard has real data immediately.
if (store.getServices().length === 0) {
  store.addService("GitHub", "https://github.com");
  store.addService("GitHub API", "https://api.github.com");
  store.addService("Google", "https://www.google.com");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", checkIntervalMs: CHECK_INTERVAL_MS });
});

app.get("/api/services", (req, res) => {
  const services = store.getServices().map((service) => {
    const history = store.getHistoryForService(service.id, 1);
    const latest = history[history.length - 1] || null;
    return {
      ...service,
      latestStatus: latest ? latest.status : "pending",
      latestResponseTimeMs: latest ? latest.responseTimeMs : null,
      uptimePercent: store.computeUptimePercent(service.id),
    };
  });
  res.json(services);
});

app.post("/api/services", (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return res.status(400).json({ error: "url must be a valid absolute URL" });
  }
  const service = store.addService(name, url);
  res.status(201).json(service);
});

app.get("/api/services/:id", (req, res) => {
  const service = store.getServices().find((s) => s.id === req.params.id);
  if (!service) {
    return res.status(404).json({ error: "service not found" });
  }
  const history = store.getHistoryForService(service.id, 1);
  const latest = history[history.length - 1] || null;
  res.json({
    ...service,
    latestStatus: latest ? latest.status : "pending",
    latestResponseTimeMs: latest ? latest.responseTimeMs : null,
    uptimePercent: store.computeUptimePercent(service.id),
  });
});

app.delete("/api/services/:id", (req, res) => {
  store.removeService(req.params.id);
  res.status(204).end();
});

app.get("/api/services/:id/history", (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json(store.getHistoryForService(req.params.id, limit));
});

app.listen(PORT, () => {
  console.log(`ServiceWatch backend listening on http://localhost:${PORT}`);
  startMonitor();
});
