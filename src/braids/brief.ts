import { FormatError, parseFrontMatter, type FrontValue } from "./frontmatter.js";

export const STATUSES = ["Outline", "To Do", "In Progress", "Done"] as const;
export type Status = (typeof STATUSES)[number];

export const DELIVERY_MODES = ["epic", "main"] as const;
export type Delivery = (typeof DELIVERY_MODES)[number];

export interface Section {
  readonly title: string;
  readonly text: string;
}

export interface Brief {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly labels: readonly string[];
  readonly dependencies: readonly string[];
  readonly order: number | null;
  /** Braids only; `epic` when the front matter leaves it out. Always null for a strand. */
  readonly delivery: Delivery | null;
  readonly body: string;
  readonly sections: readonly Section[];
}

/** `0002` for a braid, `0002/A` for a strand. */
export const BRAID_ID = /^\d{4}$/;
export const STRAND_ID = /^\d{4}\/[A-Z]$/;

const KEYS = new Set(["id", "title", "status", "labels", "dependencies", "order", "delivery"]);

export function parseSections(body: string): Section[] {
  const sections: Section[] = [];
  let title: string | null = null;
  let text: string[] = [];
  let fence = false;
  const flush = () => {
    if (title !== null) {
      sections.push({ title, text: text.join("\n").trim() });
    }
  };
  for (const line of body.split("\n")) {
    if (/^(```|~~~)/.test(line)) {
      fence = !fence;
    }
    const heading = fence ? null : /^## +(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      title = heading[1] ?? "";
      text = [];
    } else {
      text.push(line);
    }
  }
  flush();
  return sections;
}

/**
 * Parses a brief.md. `expectedId` is the id the folder implies; the front matter must
 * match it. Every error names `file`.
 */
export function parseBrief(text: string, file: string, expectedId: string): Brief {
  const front = parseFrontMatter(text, file);
  const where = (key: string) => {
    const line = front.lines.get(key);
    return line === undefined ? "" : `line ${line}: `;
  };
  for (const key of front.fields.keys()) {
    if (!KEYS.has(key)) {
      throw new FormatError(file, `${where(key)}unknown key: ${key}`);
    }
  }
  const text1 = (key: string, required: boolean): string | null => {
    const value: FrontValue | undefined = front.fields.get(key);
    if (value === undefined) {
      if (required) {
        throw new FormatError(file, `missing key: ${key}`);
      }
      return null;
    }
    if (typeof value !== "string" || value === "") {
      throw new FormatError(file, `${where(key)}${key} must be a non-empty value`);
    }
    return value;
  };
  const list = (key: string): readonly string[] => {
    const value = front.fields.get(key);
    if (value === undefined) {
      return [];
    }
    if (typeof value === "string") {
      throw new FormatError(file, `${where(key)}${key} must be a list, like [a, b]`);
    }
    return value;
  };

  const strand = STRAND_ID.test(expectedId);
  const id = text1("id", true) ?? "";
  if (id !== expectedId) {
    throw new FormatError(file, `${where("id")}id ${id} does not match its folder (expected ${expectedId})`);
  }
  const title = text1("title", true) ?? "";
  const status = text1("status", true) ?? "";
  if (!(STATUSES as readonly string[]).includes(status)) {
    throw new FormatError(file, `${where("status")}status must be one of ${STATUSES.join(", ")}; got: ${status}`);
  }
  const labels = list("labels");
  const dependencies = list("dependencies");
  for (const dep of dependencies) {
    if (!BRAID_ID.test(dep) && !STRAND_ID.test(dep)) {
      throw new FormatError(file, `${where("dependencies")}dependency must be a braid or strand id like 0002 or 0002/A; got: ${dep}`);
    }
    if (dep === id) {
      throw new FormatError(file, `${where("dependencies")}${id} depends on itself`);
    }
  }
  const orderText = text1("order", false);
  let order: number | null = null;
  if (orderText !== null) {
    if (!/^\d+$/.test(orderText)) {
      throw new FormatError(file, `${where("order")}order must be a whole number; got: ${orderText}`);
    }
    order = Number(orderText);
  }
  const deliveryText = text1("delivery", false);
  let delivery: Delivery | null = null;
  if (strand) {
    if (deliveryText !== null) {
      throw new FormatError(file, `${where("delivery")}delivery is set per braid, not per strand`);
    }
  } else {
    delivery = "epic";
    if (deliveryText !== null) {
      if (!(DELIVERY_MODES as readonly string[]).includes(deliveryText)) {
        throw new FormatError(file, `${where("delivery")}delivery must be epic or main; got: ${deliveryText}`);
      }
      delivery = deliveryText as Delivery;
    }
  }
  return {
    id,
    title,
    status: status as Status,
    labels,
    dependencies,
    order,
    delivery,
    body: front.body,
    sections: parseSections(front.body),
  };
}
