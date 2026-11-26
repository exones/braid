// Percents as the board and the CLI show them (0074/E): whole numbers. Cursor reports unrounded values (70.496946…) that overflowed the chip.
// Pure (no Node.js), so the page uses it too. Decisions (over, near) are made on the raw value, never on this text.

/** `73` for 73.21908396946564; `0` for NaN. */
export const percent = (n: number): string => String(Number.isFinite(n) ? Math.round(n) : 0);
