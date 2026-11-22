// The role emojis of braid thread titles; no Node imports, so the board page can use them too.
export const ROLES = { coordinator: "🧠", worker: "💻", review: "👀", research: "🧪" } as const;
export type TitleRole = keyof typeof ROLES;
/** The board's steering thread (0064): it belongs to no item, so it has no id in its title and is no `TitleRole`. */
export const STEERING_EMOJI = "🚦";
