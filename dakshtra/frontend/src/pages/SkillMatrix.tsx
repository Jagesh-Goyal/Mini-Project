import { useEffect, useState } from "react";

import { skillMatrixApi } from "../api/skillApi";
import Table from "../components/ui/Table";

export default function SkillMatrix() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    skillMatrixApi().then((r) => setRows(r.data));
  }, []);

  const columns = rows[0] ? Object.keys(rows[0]) : [];
  return <div className="card">{columns.length ? <Table columns={columns} rows={rows} /> : <p>No data.</p>}</div>;
}
