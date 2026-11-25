/** What `copyText` needs from the page; the browser's own objects fit it. */
export interface CopyEnv {
  readonly isSecureContext?: boolean | undefined;
  readonly clipboard?: { writeText(text: string): Promise<void> } | undefined;
  readonly document?: {
    createElement(tag: "textarea"): CopyTextarea;
    readonly body: { appendChild(n: CopyTextarea): unknown; removeChild(n: CopyTextarea): unknown };
    execCommand(command: "copy"): boolean;
  } | undefined;
}
export interface CopyTextarea {
  value: string;
  readOnly: boolean;
  style: Record<string, string> & object;
  setAttribute(name: string, value: string): void;
  focus(): void;
  select(): void;
  setSelectionRange(from: number, to: number): void;
}

/**
 * Copies text: the clipboard API in a secure context, otherwise (plain http on a Tailscale address, or a rejected write)
 * a hidden textarea and `execCommand("copy")`. Resolves to whether it worked.
 */
export async function copyText(text: string, env: CopyEnv): Promise<boolean> {
  if (env.isSecureContext === true && env.clipboard !== undefined) {
    try {
      await env.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the textarea
    }
  }
  const doc = env.document;
  if (doc === undefined) {
    return false;
  }
  const area = doc.createElement("textarea");
  area.value = text;
  // iOS Safari: not readonly (it would refuse the selection), 16 px (no zoom), off-screen.
  area.readOnly = false;
  area.setAttribute("aria-hidden", "true");
  Object.assign(area.style, { position: "fixed", top: "0", left: "-9999px", fontSize: "16px", opacity: "0" });
  doc.body.appendChild(area);
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    return doc.execCommand("copy");
  } catch {
    return false;
  } finally {
    doc.body.removeChild(area);
  }
}
