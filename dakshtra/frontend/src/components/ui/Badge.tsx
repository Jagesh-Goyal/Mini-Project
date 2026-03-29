export default function Badge({ label, tone = "slate" }: { label: string; tone?: "slate" | "success" | "warning" | "danger" }) {
  const cls =
    tone === "success"
      ? "bg-green-100 text-green-700"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : tone === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
