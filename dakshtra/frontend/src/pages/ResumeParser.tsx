import { useState } from "react";

import api from "../api/axiosConfig";
import Badge from "../components/ui/Badge";

export default function ResumeParser() {
  const [skills, setSkills] = useState<any[]>([]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/api/resume/parse", form, { headers: { "Content-Type": "multipart/form-data" } });
    setSkills(res.data.skills);
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <input type="file" accept="application/pdf" onChange={onUpload} />
      </div>
      <div className="card flex flex-wrap gap-2">
        {skills.map((s) => (
          <Badge key={s.skill} label={`${s.skill} (${s.confidence})`} tone="success" />
        ))}
      </div>
    </div>
  );
}
