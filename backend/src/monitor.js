const store = require("./store");

const CHECK_TIMEOUT_MS = 8000;
const CHECK_INTERVAL_MS = 30000;

async function checkService(service) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(service.url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseTimeMs = Date.now() - startedAt;
    return {
      timestamp: new Date().toISOString(),
      status: response.ok ? "up" : "down",
      statusCode: response.status,
      responseTimeMs,
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      timestamp: new Date().toISOString(),
      status: "down",
      statusCode: null,
      responseTimeMs: Date.now() - startedAt,
      error: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
}

async function runCheckCycle() {
  const services = store.getServices();
  for (const service of services) {
    const result = await checkService(service);
    store.recordCheck(service.id, result);

    if (result.status === "down") {
      console.warn(
        `[ALERT] ${service.name} (${service.url}) is DOWN - ${result.error || result.statusCode}`
      );
    }
  }
}

function startMonitor() {
  runCheckCycle();
  return setInterval(runCheckCycle, CHECK_INTERVAL_MS);
}

module.exports = { startMonitor, runCheckCycle, checkService, CHECK_INTERVAL_MS };
