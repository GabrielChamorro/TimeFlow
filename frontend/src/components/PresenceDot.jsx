import { presenceText } from "../utils/presence.js";
export default function PresenceDot({ value, name = "" }) {
  const label = `${name ? name + ": " : ""}${presenceText(value)}`;
  return <span role="img" aria-label={label} title={label} className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${value === true ? "bg-emerald-500" : value === false ? "bg-rose-500" : "bg-slate-400"}`}/>;
}
