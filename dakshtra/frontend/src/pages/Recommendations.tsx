import { useEffect, useState } from "react";

import api from "../api/axiosConfig";
import Badge from "../components/ui/Badge";

export default function Recommendations() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/recommendations/training").then((r) => setRows(r.data));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((row, i) => (
        <div key={i} className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{row.skill}</h3>
            <Badge label={row.severity} tone={row.severity === "critical" ? "danger" : "warning"} />
          </div>
          <p>Action: {row.action}</p>
          <p>Priority: {row.priority}/10</p>
          <div className="space-y-1 text-sm text-secondary">
            {row.resources?.map((r: any) => <a key={r.url} href={r.url} target="_blank" rel="noreferrer">{r.title}</a>)}
          </div>
        </div>
      ))}
    </div>
  );
}
