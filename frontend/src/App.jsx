import { useEffect, useState, useCallback } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000/api";

function StatusBadge({ status }) {
  const styles = {
    up: { background: "#0d4d2b", color: "#4ade80", label: "UP" },
    down: { background: "#4d0d0d", color: "#f87171", label: "DOWN" },
    pending: { background: "#3a3a3a", color: "#d4d4d4", label: "PENDING" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      style={{
        background: s.background,
        color: s.color,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {s.label}
    </span>
  );
}

function ServiceCard({ service, onDelete }) {
  return (
    <div className="service-card">
      <div className="service-card-header">
        <h3>{service.name}</h3>
        <StatusBadge status={service.latestStatus} />
      </div>
      <p className="service-url">{service.url}</p>
      <div className="service-metrics">
        <div>
          <span className="metric-label">Response time</span>
          <span className="metric-value">
            {service.latestResponseTimeMs != null ? `${service.latestResponseTimeMs} ms` : "—"}
          </span>
        </div>
        <div>
          <span className="metric-label">Uptime</span>
          <span className="metric-value">
            {service.uptimePercent != null ? `${service.uptimePercent}%` : "—"}
          </span>
        </div>
      </div>
      <button className="delete-btn" onClick={() => onDelete(service.id)}>
        Remove
      </button>
    </div>
  );
}

function AddServiceForm({ onAdd }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to add service");
      }
      setName("");
      setUrl("");
      onAdd();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        placeholder="Service name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button type="submit">Add Service</button>
      {error && <span className="form-error">{error}</span>}
    </form>
  );
}

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/services`);
      const data = await res.json();
      setServices(data);
    } catch {
      // Backend not reachable yet; keep previous state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
    const interval = setInterval(loadServices, 10000);
    return () => clearInterval(interval);
  }, [loadServices]);

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/services/${id}`, { method: "DELETE" });
    loadServices();
  };

  const upCount = services.filter((s) => s.latestStatus === "up").length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>ServiceWatch</h1>
        <p>{upCount} / {services.length} services healthy</p>
      </header>

      <AddServiceForm onAdd={loadServices} />

      {loading ? (
        <p className="loading">Loading services…</p>
      ) : (
        <div className="service-grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
