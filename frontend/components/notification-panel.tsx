"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell, Mail, RefreshCw, ChevronDown } from "lucide-react";
type Job = {
  id: string;
  request_id: string;
  kind: string;
  status: string;
  attempts: number;
  last_error: string | null;
};
type Summary = {
  setup: { configured: boolean; missing: string[]; to: string };
  counts: { status: string; count: number }[];
  recent: Job[];
  canRetry: boolean;
};
export default function NotificationPanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications");
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || "Could not load email notification status.");
      setData(d);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load email notification status.",
      );
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => clearInterval(timer);
  }, [refresh]);
  async function retry(id: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not retry this notification.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!data && !error)
    return (
      <div className="notification-panel" role="status">
        Checking email notification setup…
      </div>
    );
  return (
    <section
      className="notification-panel"
      aria-label="Email notification status"
    >
      <div className="notification-panel-summary">
        <span className="notification-icon">
          <Bell size={21} />
        </span>
        <div>
          <h2>
            Email alerts{" "}
            <span
              className={
                data?.setup.configured
                  ? "notification-state configured"
                  : "notification-state"
              }
            >
              {data?.setup.configured ? "Configured" : "Not configured"}
            </span>
          </h2>
          <p>
            {data?.setup.configured
              ? `New request details are queued for ${data.setup.to}.`
              : "Requests are saved and queued. Configure the email sender in Railway to enable sending."}
          </p>
        </div>
        <button
          className="back-button"
          onClick={() => void refresh()}
          aria-label="Refresh email status"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          {!data.setup.configured && (
            <p className="notification-config-note">
              Required Railway variables:{" "}
              <strong>{data.setup.missing.join(", ")}</strong>. Use a verified
              sender or an eligible Resend test sender.
            </p>
          )}
          <div className="notification-counts">
            {["pending", "sending", "accepted", "failed"].map((status) => (
              <span key={status}>
                <strong>
                  {data.counts.find((c) => c.status === status)?.count || 0}
                </strong>{" "}
                {status === "accepted" ? "accepted by email service" : status}
              </span>
            ))}
          </div>
          <details>
            <summary>
              Recent email notifications <ChevronDown size={15} />
            </summary>
            <p className="fine-print">
              “Accepted” means the sending service accepted the email; inbox
              delivery is not yet confirmed. Check your email provider and Spam
              folder if needed.
            </p>
            {!data.recent.length ? (
              <p className="fine-print">
                New booking and contact requests will appear here.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Email status</th>
                      <th>Attempts</th>
                      <th>Last issue</th>
                      <th>
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((job) => (
                      <tr key={job.id}>
                        <td>
                          {job.kind}
                          <br />
                          <small>{job.request_id.slice(0, 8)}</small>
                        </td>
                        <td>{job.status}</td>
                        <td>{job.attempts}</td>
                        <td>{job.last_error || "—"}</td>
                        <td>
                          {job.status === "failed" && data.canRetry && (
                            <button
                              className="back-button"
                              disabled={busy || !data.setup.configured}
                              onClick={() => void retry(job.id)}
                            >
                              Retry email <Mail size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        </>
      )}
    </section>
  );
}
