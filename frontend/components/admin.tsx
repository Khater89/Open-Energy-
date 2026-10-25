"use client";
import { useState, useEffect, useCallback } from "react";
import {
  LockKeyhole,
  ArrowRight,
  LogOut,
  Search,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import NotificationPanel from "./notification-panel";
import { statuses } from "@/lib/content";
type User = { name: string; role: string };
type RequestRecord = {
  id: string;
  kind: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  city: string;
  property_type: string;
  message: string;
  preferred_date: string;
  preferred_time: string;
  monthly_bill: string;
  address: string;
  status: string;
  notes: string;
  version: number;
  created_at: string;
  subject: string;
};
export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<RequestRecord[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<RequestRecord | null>(null);
  const [draftStatus, setDraftStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) setUser(d.user);
        else if (r.status !== 401) throw new Error(d.error);
      })
      .catch((e) =>
        setError(e.message || "Could not connect to the request service."),
      )
      .finally(() => setLoading(false));
  }, []);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        `/api/admin/requests?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`,
      );
      const d = await r.json();
      if (r.status === 401) {
        setUser(null);
        setSelected(null);
        throw new Error("Your session ended. Please sign in again.");
      }
      if (!r.ok) throw new Error(d.error);
      setRecords(d.requests);
      setMetrics(
        Object.fromEntries(
          d.metrics.map((m: { status: string; count: number }) => [
            m.status,
            m.count,
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load requests.");
    } finally {
      setBusy(false);
    }
  }, [q, status]);
  useEffect(() => {
    if (user) {
      const t = setTimeout(() => void load(), 250);
      return () => clearTimeout(t);
    }
  }, [user, load]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPassword("");
      setUser(d.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/logout", { method: "POST" });
      if (!r.ok) throw new Error("Could not sign out. Please retry.");
      setUser(null);
      setRecords([]);
      setSelected(null);
      setNotice("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          kind: selected.kind,
          version: selected.version,
          status: draftStatus,
          notes,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSelected({
        ...selected,
        status: draftStatus,
        notes,
        version: d.version,
      });
      setNotice("Changes saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="container loading-status" role="status">
        Checking staff access…
      </div>
    );
  if (!user)
    return (
      <section className="container admin-shell">
        <div className="form-card login-card">
          <span className="service-icon" style={{ marginBottom: 25 }}>
            <LockKeyhole size={24} />
          </span>
          <span className="eyebrow">OPEN ENERGY / STAFF ONLY</span>
          <h2>Welcome back.</h2>
          <p>Sign in to review consultation and contact requests.</p>
          <form onSubmit={login}>
            <div className="form-fields">
              <div className="field">
                <label htmlFor="staff-email">Work email</label>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="staff-password">Password</label>
                <input
                  id="staff-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <div className="form-actions">
              <button className="button" disabled={busy}>
                {busy ? "Signing in…" : "Sign in securely"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
          <p className="fine-print">
            Access is provisioned by your administrator. There is no public
            registration.
          </p>
        </div>
      </section>
    );
  return (
    <section className="container admin-shell">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">OPEN ENERGY / WORKSPACE</span>
          <h1>A brighter pipeline.</h1>
          <p>
            Welcome, {user.name} · {user.role} access
          </p>
        </div>
        <button className="button secondary" onClick={logout} disabled={busy}>
          Sign out <LogOut size={15} />
        </button>
      </div>
      <NotificationPanel />
      <div className="metric-grid">
        {statuses.map((s) => (
          <div className="metric" key={s}>
            <span>{s} requests</span>
            <strong>{metrics[s] || 0}</strong>
          </div>
        ))}
      </div>
      <div className="admin-filters">
        <label className="search-field">
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, city or phone"
            aria-label="Search requests"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          className="button secondary small"
          onClick={() => {
            setSelected(null);
            void load();
          }}
          disabled={busy}
        >
          Refresh <RefreshCw size={14} />
        </button>
        <small style={{ color: "#6b786b", fontSize: 11 }}>
          Latest 200 matching requests
        </small>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <div className="table-scroll" aria-busy={busy}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name / email</th>
              <th>Request</th>
              <th>System</th>
              <th>Location</th>
              <th>Status</th>
              <th>Received (UTC)</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.full_name}</strong>
                  <br />
                  {r.email}
                </td>
                <td>{r.kind}</td>
                <td>{r.service_type || "—"}</td>
                <td>{r.city || "—"}</td>
                <td>
                  <span className="status-badge">{r.status}</span>
                </td>
                <td>
                  {new Date(r.created_at).toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  })}
                </td>
                <td>
                  <button
                    className="back-button"
                    onClick={() => {
                      setSelected(r);
                      setDraftStatus(r.status);
                      setNotes(r.notes);
                      setNotice("");
                      setError("");
                      setTimeout(
                        () =>
                          document
                            .getElementById("request-detail")
                            ?.scrollIntoView({ block: "start" }),
                        0,
                      );
                    }}
                  >
                    View <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!records.length && !busy && (
          <div className="empty-state">
            <h2>No requests found.</h2>
            <p>
              {q || status
                ? "Try clearing your search or status filter."
                : "New consultation and contact requests will appear here."}
            </p>
            {(q || status) && (
              <button
                className="button secondary"
                onClick={() => {
                  setQ("");
                  setStatus("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      {selected && (
        <section className="admin-detail" id="request-detail">
          <div className="admin-heading">
            <h2>{selected.full_name}</h2>
            <button className="back-button" onClick={() => setSelected(null)}>
              Close <X size={16} />
            </button>
          </div>
          <dl className="detail-grid">
            {Object.entries({
              Reference: selected.id,
              Type: selected.kind,
              Email: selected.email,
              Phone: selected.phone,
              Service: selected.service_type,
              City: selected.city,
              Property: selected.property_type,
              Address: selected.address,
              "Preferred date": selected.preferred_date,
              "Preferred time (property local time)": selected.preferred_time,
              "Monthly bill (currency in notes)": selected.monthly_bill,
              Subject: selected.subject,
              Message: selected.message,
            })
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          {user.role === "viewer" ? (
            <div className="notice">
              Read-only access. Status: {selected.status}
              <br />
              Notes: {selected.notes || "None"}
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="request-status">Request status</label>
                <select
                  id="request-status"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="staff-notes">Internal notes</label>
                <textarea
                  id="staff-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={4000}
                />
              </div>
              <div className="admin-detail-actions">
                <button className="button" disabled={busy} onClick={save}>
                  {busy ? "Saving…" : "Save changes"}
                  <ArrowRight size={15} />
                </button>
                <span className="fine-print">
                  Version {selected.version} · conflicting edits are blocked.
                </span>
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}
