"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { changePassword } from "@/app/actions/account";

const inputClass =
  "w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30";

export function AccountForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) {
      setMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    startTransition(async () => {
      const res = await changePassword({ current, next });
      if (res.error) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg({ ok: true, text: "Password updated." });
    });
  }

  return (
    <Card>
      <h2 className="mb-1 text-base font-medium">Account</h2>
      <p className="mb-5 text-sm text-muted">
        Signed in as <span className="text-text">{email}</span>.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted">
            Current password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted">
            New password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted">
            Confirm new password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !current || !next}
            className="rounded-xl bg-text px-4 py-2.5 text-sm font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Update password
          </button>
          {msg && (
            <span
              className={`text-sm ${msg.ok ? "text-positive" : "text-negative"}`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
