"use client";

import { useState, useTransition } from "react";
import { T } from "../theme";

/**
 * Credentials form: fills WP admin URL + username + one-time password, sends
 * the customer email via the sendCredentials server action, surfaces errors.
 */
export function CredentialsForm({
  orderId,
  defaults,
  action,
}: {
  orderId: string;
  defaults: { wpAdminUrl: string; wpUsername: string };
  action: (id: string, form: FormData) => Promise<{ ok: boolean; error?: string } | undefined>;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(form) =>
        start(async () => {
          const res = await action(orderId, form);
          setMessage(
            res?.ok
              ? { ok: true, text: "Credentials emailed — order is now ACTIVE." }
              : { ok: false, text: res?.error || "Failed." },
          );
        })
      }
      className="space-y-3"
    >
      <div>
        <label className={T.label}>WordPress admin URL</label>
        <input name="wpAdminUrl" defaultValue={defaults.wpAdminUrl} placeholder="https://site.designik.us/wp-admin" className={T.input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={T.label}>Username</label>
          <input name="wpUsername" defaultValue={defaults.wpUsername} placeholder="admin" className={T.input} />
        </div>
        <div>
          <label className={T.label}>Temporary password</label>
          <input name="tempPassword" placeholder="Sent once, never stored" className={T.input} />
        </div>
      </div>
      {message && (
        <p className={`text-[13px] font-medium ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
      )}
      <button disabled={pending} className={T.btnPrimary}>
        {pending ? "Sending…" : "Mark active + email credentials"}
      </button>
    </form>
  );
}
