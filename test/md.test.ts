import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const web = fileURLToPath(new URL("../web", import.meta.url));
const out = mkdtempSync(join(tmpdir(), "braid-md-"));
after(() => rmSync(out, { recursive: true, force: true }));

/** Bundles the page's Markdown component for Node and renders it to a string. */
async function renderMd(text: string): Promise<string> {
  const { build } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  await build({
    root: web,
    configFile: false,
    logLevel: "silent",
    plugins: [react()],
    ssr: { noExternal: true },
    build: {
      ssr: join(web, "src/Md.tsx"),
      outDir: out,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: "md.mjs" } },
    },
  });
  const bundle = (await import(pathToFileURL(join(out, "md.mjs")).href)) as {
    Md: (props: { text: string; empty: string }) => unknown;
  };
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(createElement(bundle.Md as never, { text, empty: "none" }));
}

test("Markdown renders, but HTML in a brief is not rendered as HTML", async () => {
  const html = await renderMd(
    "## Goal\n\nPlain **bold** text.\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(2)>\n\nInline <b>tag</b> here.\n",
  );
  assert.match(html, /<h2>Goal<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /<b>/i);
  // The tags show as text instead.
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
