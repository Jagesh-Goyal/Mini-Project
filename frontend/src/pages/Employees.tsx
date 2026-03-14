import { useEffect, useState } from 'react';
import { Plus, Search, X, User, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import toast from 'react-hot-toast';
import type { Employee } from '@/types';

const emptyForm = { name: '', department: '', role: '', year_exp: '' };

export default function Employees() {
  const { employees, loadingEmployees, fetchEmployees, addEmployee } = useStore();
  const [showAdd, setShowAdd]   = useState(false);
  const [editEmp, setEditEmp]   = useState<Employee | null>(null);
  const [search, setSearch]     = useState('');
  const [form, setForm]         = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.department || !form.role || !form.year_exp) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    const success = await addEmployee({
      name: form.name,
      department: form.department,
      role: form.role,
      year_exp: parseInt(form.year_exp),
    });
    setSubmitting(false);
    if (success) { setForm(emptyForm); setShowAdd(false); }
  };

  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setForm({ name: emp.name, department: emp.department, role: emp.role, year_exp: String(emp.year_exp) });
  };

  const handleUpdate = async () => {
    if (!editEmp) return;
    if (!form.name || !form.department || !form.role || !form.year_exp) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateEmployee(editEmp.id, {
        name: form.name,
        department: form.department,
        role: form.role,
        year_exp: parseInt(form.year_exp),
      });
      toast.success('Employee updated');
      setEditEmp(null);
      setForm(emptyForm);
      fetchEmployees();
    } catch {
      toast.error('Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    try {
      await api.deleteEmployee(emp.id);
      toast.success(`${emp.name} deleted`);
      fetchEmployees();
    } catch {
      toast.error('Delete failed');
    }
  };

  const EmployeeForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      {(['name', 'department', 'role'] as const).map((field) => (
        <div key={field}>
          <label className="block text-sm text-slate-400 mb-1 capitalize">{field}</label>
          <input
            className="input-modern px-3 py-2"
            placeholder={field === 'name' ? 'John Doe' : field === 'department' ? 'Engineering' : 'Senior Developer'}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        </div>
      ))}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Years of Experience</label>
        <input
          type="number"
          className="input-modern px-3 py-2"
          placeholder="5"
          value={form.year_exp}
          onChange={(e) => setForm({ ...form, year_exp: e.target.value })}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button className="btn-secondary flex-1 px-4 py-2" onClick={() => { setShowAdd(false); setEditEmp(null); setForm(emptyForm); }}>
          Cancel
        </button>
        <button className="btn-primary flex-1 px-4 py-2 disabled:opacity-50" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Employees</h1>
          <p className="text-sm text-slate-400 mt-1">{employees.length} total employees</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-4 py-2" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input-modern px-10 py-2" placeholder="Search by name or role..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingEmployees ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-cyan-500/8 transition">
                  <td className="px-4 py-3 text-slate-400">{emp.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{emp.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-200 rounded text-sm">{emp.department}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{emp.role}</td>
                  <td className="px-4 py-3 text-slate-400">{emp.year_exp} yrs</td>
                  <td className="px-4 py-3">
                    <div className="row-action-group justify-end">
                      <button type="button" className="row-action-btn" title="Edit employee" onClick={() => openEdit(emp)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="row-action-btn text-red-400 hover:text-red-300" title="Delete employee" onClick={() => void handleDelete(emp)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="auth-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add New Employee</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <EmployeeForm onSubmit={() => void handleAdd()} submitLabel="Add Employee" />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEmp && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="auth-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Edit Employee</h2>
              <button onClick={() => { setEditEmp(null); setForm(emptyForm); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <EmployeeForm onSubmit={() => void handleUpdate()} submitLabel="Save Changes" />
          </div>
        </div>
      )}
    </div>
  );
}
