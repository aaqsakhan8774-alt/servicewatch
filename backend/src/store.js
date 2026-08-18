const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const SERVICES_FILE = path.join(DATA_DIR, "services.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_HISTORY_PER_SERVICE = 200;

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SERVICES_FILE)) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getServices() {
  return readJson(SERVICES_FILE);
}

function addService(name, url) {
  const services = getServices();
  const service = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    url,
    createdAt: new Date().toISOString(),
  };
  services.push(service);
  writeJson(SERVICES_FILE, services);
  return service;
}

function removeService(id) {
  const services = getServices().filter((s) => s.id !== id);
  writeJson(SERVICES_FILE, services);

  const history = getAllHistory().filter((h) => h.serviceId !== id);
  writeJson(HISTORY_FILE, history);
}

function getAllHistory() {
  return readJson(HISTORY_FILE);
}

function getHistoryForService(serviceId, limit = 50) {
  return getAllHistory()
    .filter((h) => h.serviceId === serviceId)
    .slice(-limit);
}

function recordCheck(serviceId, result) {
  const history = getAllHistory();
  history.push({ serviceId, ...result });

  const forService = history.filter((h) => h.serviceId === serviceId);
  if (forService.length > MAX_HISTORY_PER_SERVICE) {
    const excess = forService.length - MAX_HISTORY_PER_SERVICE;
    const toRemove = new Set(forService.slice(0, excess).map((h) => h.timestamp));
    const trimmed = history.filter(
      (h) => !(h.serviceId === serviceId && toRemove.has(h.timestamp))
    );
    writeJson(HISTORY_FILE, trimmed);
    return;
  }

  writeJson(HISTORY_FILE, history);
}

function computeUptimePercent(serviceId) {
  const history = getHistoryForService(serviceId, MAX_HISTORY_PER_SERVICE);
  if (history.length === 0) return null;
  const upCount = history.filter((h) => h.status === "up").length;
  return Math.round((upCount / history.length) * 1000) / 10;
}

module.exports = {
  ensureDataFiles,
  getServices,
  addService,
  removeService,
  getHistoryForService,
  recordCheck,
  computeUptimePercent,
};
