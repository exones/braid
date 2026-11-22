// Reads a fetch reply for the page: the body is parsed as JSON only when it is JSON, so a plain-text error
// (a proxy's, a refusal's) never surfaces as a JSON parse error.

/** What `readReply` needs of a fetch `Response`. */
export interface ReplyLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  text(): Promise<string>;
}

/** The parsed body of an ok reply; for an error, throws with the body's `error`, or its status and text. */
export async function readReply<T>(response: ReplyLike): Promise<T> {
  const text = await response.text();
  let body: unknown;
  let json = true;
  try {
    body = JSON.parse(text);
  } catch {
    json = false;
  }
  if (response.ok) {
    if (!json) {
      throw new Error(`The board answered ${response.status} with something that isn't JSON: ${text.slice(0, 200)}`);
    }
    return body as T;
  }
  if (json && typeof body === "object" && body !== null && "error" in body) {
    throw new Error(String(body.error));
  }
  const detail = text.trim().slice(0, 200) || response.statusText;
  throw new Error(`${response.status} ${detail}`.trim());
}
