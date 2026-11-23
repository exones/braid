import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The version of this braid, from its package.json. */
export function readVersion(): string {
  const path = fileURLToPath(new URL("../package.json", import.meta.url));
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    typeof parsed.version !== "string"
  ) {
    throw new Error("package.json version is missing");
  }
  return parsed.version;
}
