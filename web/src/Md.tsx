import Markdown from "react-markdown";

/** Briefs, reports and logs are Markdown; raw HTML in them is not rendered as HTML. */
export function Md({ text, empty }: { text: string | null; empty: string }) {
  if (text === null || text.trim() === "") {
    return <p className="text-slate-500">{empty}</p>;
  }
  return (
    <div className="md">
      <Markdown>{text}</Markdown>
    </div>
  );
}
