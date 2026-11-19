// The role emojis of braid thread titles; no Node imports, so the board page can use them too.
export const ROLES = { coordinator: "🧠", worker: "💻", review: "👀", research: "🧪" } as const;
export type TitleRole = keyof typeof ROLES;
