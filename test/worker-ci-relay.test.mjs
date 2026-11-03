import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Disposable BRAID-003/A transport canary. It reads only its own control file.
const controlUrl = new URL(
  "../epics/braid/003-worker-skill/validation/A-ci-relay/control.json",
  import.meta.url,
);

test("BRAID-003/A relay canary requires GOOD control", () => {
  const control = JSON.parse(readFileSync(controlUrl, "utf8"));
  assert.equal(control.state, "GOOD", "relay canary control must be GOOD");
});
