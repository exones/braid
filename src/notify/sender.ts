// Sends one push to ntfy with the built-in fetch: JSON publishing (`POST <server>` with the topic in the
// body), so titles in any script survive, which HTTP headers don't allow. A send gives up after 10 s.
import { TOKEN_VAR, type NotifyConfig } from "./config.js";
import type { Push } from "./message.js";

export const SEND_TIMEOUT_MS = 10_000;

/** Sends a push; rejects with a reason that names neither the topic nor the token. */
export type Sender = (config: NotifyConfig, push: Omit<Push, "key" | "item" | "kind">, token: string | null) => Promise<void>;

/** The JSON body ntfy publishes from (https://docs.ntfy.sh/publish/#publish-as-json). */
export function ntfyBody(config: NotifyConfig, push: Omit<Push, "key" | "item" | "kind">): Record<string, unknown> {
  return {
    topic: config.topic,
    title: push.title,
    message: push.body,
    tags: [...push.tags],
    priority: push.priority === "high" ? 4 : push.priority === "low" ? 2 : 3,
    ...(push.click === null ? {} : { click: push.click }),
    ...(push.sequence === null ? {} : { sequence_id: push.sequence }),
  };
}

/** Clears a push by its sequence ID (`PUT <server>/<topic>/<sequence>/clear`): it leaves the device (Android and the web app only). */
export type Clearer = (config: NotifyConfig, sequence: string, token: string | null) => Promise<void>;

export function ntfyClearer(fetcher: typeof fetch = fetch, timeoutMs: number = SEND_TIMEOUT_MS): Clearer {
  return async (config, sequence, token) => {
    const host = new URL(config.server).host;
    let res: Response;
    try {
      res = await fetcher(`${config.server}/${encodeURIComponent(config.topic)}/${encodeURIComponent(sequence)}/clear`, {
        method: "PUT",
        headers: token === null ? {} : { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new Error(`can't reach ${host}`);
    }
    await res.body?.cancel().catch(() => {});
    if (!res.ok) {
      throw new Error(`${host} answered HTTP ${res.status}`);
    }
  };
}

export function ntfySender(fetcher: typeof fetch = fetch, timeoutMs: number = SEND_TIMEOUT_MS): Sender {
  return async (config, push, token) => {
    const host = new URL(config.server).host;
    let res: Response;
    try {
      res = await fetcher(config.server, {
        method: "POST",
        headers: { "content-type": "application/json", ...(token === null ? {} : { authorization: `Bearer ${token}` }) },
        body: JSON.stringify(ntfyBody(config, push)),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      throw new Error(name === "TimeoutError" || name === "AbortError" ? `${host} did not answer in ${Math.round(timeoutMs / 1000)} s` : `can't reach ${host}`);
    }
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      throw new Error(`${host} answered HTTP ${res.status}${res.status === 401 || res.status === 403 ? ` (check ${TOKEN_VAR})` : ""}`);
    }
    await res.body?.cancel().catch(() => {});
  };
}
