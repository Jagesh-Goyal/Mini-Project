import { useEffect, useState } from "react";

import { createEmployeeApi, listEmployeesApi } from "../api/employeeApi";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { useAuth } from "../hooks/useAuth";

export default function Employees() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", department: "", team: "", job_title: "", years_experience: 0 });

  const load = () => listEmployeesApi(search).then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3">
        <input className="input max-w-sm" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn bg-secondary text-white" onClick={() => load()}>Search</button>
        <button className="btn bg-primary text-white" onClick={() => setOpen(true)}>Add Employee</button>
      </div>
      <div className="card">
        <Table columns={["id", "name", "email", "department", "job_title", "team"]} rows={rows} />
      </div>
      <Modal open={open} title="Add Employee" onClose={() => setOpen(false)}>
        <div className="space-y-2">
          {Object.keys(form).map((key) => (
            <input
              key={key}
              className="input"
              placeholder={key}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <button
            className="btn bg-primary text-white"
            onClick={async () => {
              await createEmployeeApi(form, auth.csrfToken || "dev-csrf-token");
              setOpen(false);
              load();
            }}
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
