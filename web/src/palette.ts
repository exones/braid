/**
 * Project tag colours, by position in the project list. No red, pink, rose, orange or amber (nor fuchsia, yellow):
 * on the board those hues mean errors and "needs you", and a project tag must not draw the eye.
 */
export const TAG_COLOURS = [
  { dot: "bg-indigo-600", text: "text-indigo-700", border: "border-indigo-200" },
  { dot: "bg-teal-600", text: "text-teal-700", border: "border-teal-200" },
  { dot: "bg-violet-600", text: "text-violet-700", border: "border-violet-200" },
  { dot: "bg-sky-600", text: "text-sky-700", border: "border-sky-200" },
  { dot: "bg-slate-600", text: "text-slate-700", border: "border-slate-300" },
  { dot: "bg-lime-600", text: "text-lime-800", border: "border-lime-300" },
] as const;
