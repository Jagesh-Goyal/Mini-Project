import { useEffect, useState } from 'react';
import { Eye, GraduationCap, Plus, Search, X, User, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import toast from 'react-hot-toast';
import type { Employee, EmployeeProfile } from '@/types';

const emptyForm = {
  employee_code: '',
  name: '',
  email: '',
  department: '',
  role: '',
  year_exp: '',
  join_date: '',
  manager: '',
  performance_score: '70',
  team_name: '',
};

const emptyTrainingForm = {
  training_name: '',
  provider: '',
  status: 'Planned',
  focus_skill: '',
  duration_hours: '',
  completion_date: '',
};

const currentRole = localStorage.getItem('userRole') ?? 'employee';
const canManage = currentRole === 'admin' || currentRole === 'hr_manager';

function toInputDate(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

export default function Employees() {
  const { employees, loadingEmployees, fetchEmployees, addEmployee } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm]         = useState(emptyForm);
  const [trainingForm, setTrainingForm] = useState(emptyTrainingForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const resetEmployeeForm = () => setForm(emptyForm);

  const openProfile = async (employeeId: number) => {
    setSelectedEmployeeId(employeeId);
    setProfileLoading(true);
    try {
      const response = await api.getEmployeeProfile(employeeId);
      setProfile(response.data);
    } catch {
      toast.error('Failed to load employee profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setSelectedEmployeeId(null);
    setProfile(null);
    setTrainingForm(emptyTrainingForm);
    setShowTrainingForm(false);
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.department || !form.role || !form.year_exp) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    const success = await addEmployee({
      employee_code: form.employee_code || null,
      name: form.name,
      email: form.email,
      department: form.department,
      role: form.role,
      year_exp: parseInt(form.year_exp, 10),
      join_date: form.join_date || null,
      manager: form.manager || null,
      performance_score: parseInt(form.performance_score || '70', 10),
      team_name: form.team_name || null,
    });
    setSubmitting(false);
    if (success) {
      resetEmployeeForm();
      setShowAdd(false);
    }
  };

  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setForm({
      employee_code: emp.employee_code ?? '',
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      year_exp: String(emp.year_exp),
      join_date: toInputDate(emp.join_date),
      manager: emp.manager ?? '',
      performance_score: String(emp.performance_score ?? 70),
      team_name: emp.team_name ?? '',
    });
  };

  const handleUpdate = async () => {
    if (!editEmp) return;
    if (!form.name || !form.email || !form.department || !form.role || !form.year_exp) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateEmployee(editEmp.id, {
        employee_code: form.employee_code || null,
        name: form.name,
        email: form.email,
        department: form.department,
        role: form.role,
        year_exp: parseInt(form.year_exp, 10),
        join_date: form.join_date || null,
        manager: form.manager || null,
        performance_score: parseInt(form.performance_score || '70', 10),
        team_name: form.team_name || null,
      });
      toast.success('Employee updated');
      setEditEmp(null);
      resetEmployeeForm();
      await fetchEmployees();
      if (selectedEmployeeId === editEmp.id) {
        await openProfile(editEmp.id);
      }
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

  const handleAddTraining = async () => {
    if (!selectedEmployeeId || !trainingForm.training_name) {
      toast.error('Please enter a training name');
      return;
    }

    setSubmitting(true);
    try {
      await api.addTrainingHistory(selectedEmployeeId, {
        training_name: trainingForm.training_name,
        provider: trainingForm.provider || null,
        status: trainingForm.status,
        focus_skill: trainingForm.focus_skill || null,
        duration_hours: trainingForm.duration_hours ? parseInt(trainingForm.duration_hours, 10) : null,
        completion_date: trainingForm.completion_date || null,
      });
      toast.success('Training history added');
      setTrainingForm(emptyTrainingForm);
      setShowTrainingForm(false);
      await openProfile(selectedEmployeeId);
    } catch {
      toast.error('Failed to add training history');
    } finally {
      setSubmitting(false);
    }
  };

  const EmployeeForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Employee ID</label>
          <input
            className="input-modern px-3 py-2"
            placeholder="EMP-0010"
            value={form.employee_code}
            onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Join Date</label>
          <input
            type="date"
            className="input-modern px-3 py-2"
            value={form.join_date}
            onChange={(e) => setForm({ ...form, join_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input className="input-modern px-3 py-2" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input className="input-modern px-3 py-2" placeholder="john@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Department</label>
          <input className="input-modern px-3 py-2" placeholder="Engineering" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Job Role</label>
          <input className="input-modern px-3 py-2" placeholder="Senior Backend Engineer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Manager</label>
          <input className="input-modern px-3 py-2" placeholder="Asha Sharma" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Team</label>
          <input className="input-modern px-3 py-2" placeholder="Platform" value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Years of Experience</label>
          <input type="number" className="input-modern px-3 py-2" placeholder="5" value={form.year_exp} onChange={(e) => setForm({ ...form, year_exp: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Performance Score</label>
          <input type="number" className="input-modern px-3 py-2" placeholder="70" value={form.performance_score} onChange={(e) => setForm({ ...form, performance_score: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button className="btn-secondary flex-1 px-4 py-2" onClick={() => { setShowAdd(false); setEditEmp(null); resetEmployeeForm(); }}>
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
        {canManage && (
          <button className="btn-primary flex items-center gap-2 px-4 py-2" onClick={() => { resetEmployeeForm(); setShowAdd(true); }}>
            <Plus size={16} /> Add Employee
          </button>
        )}
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
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Performance</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingEmployees ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-cyan-500/8 transition">
                  <td className="px-4 py-3 text-slate-400">{emp.employee_code ?? `EMP-${emp.id}`}</td>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-200 rounded text-sm">{emp.department}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{emp.team_name ?? 'General'}</td>
                  <td className="px-4 py-3 text-slate-300">{emp.role}</td>
                  <td className="px-4 py-3 text-emerald-300">{emp.performance_score ?? 70}</td>
                  <td className="px-4 py-3 text-slate-400">{emp.year_exp} yrs</td>
                  <td className="px-4 py-3">
                    <div className="row-action-group justify-end">
                      <button type="button" className="row-action-btn" title="View profile" onClick={() => void openProfile(emp.id)}>
                        <Eye size={14} />
                      </button>
                      {canManage && (
                        <>
                          <button type="button" className="row-action-btn" title="Edit employee" onClick={() => openEdit(emp)}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" className="row-action-btn text-red-400 hover:text-red-300" title="Delete employee" onClick={() => void handleDelete(emp)}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
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
              <button onClick={() => { setEditEmp(null); resetEmployeeForm(); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <EmployeeForm onSubmit={() => void handleUpdate()} submitLabel="Save Changes" />
          </div>
        </div>
      )}

      {selectedEmployeeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white font-display">Employee Profile</h2>
                <p className="text-sm text-slate-400 mt-1">Profile, skill inventory, and training history</p>
              </div>
              <button onClick={closeProfile} className="text-slate-400 hover:text-white"><X size={22} /></button>
            </div>

            {profileLoading || !profile ? (
              <div className="py-12 text-center text-slate-400">Loading profile...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Employee</p>
                    <p className="text-xl font-semibold text-white mt-2">{profile.employee.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{profile.employee.employee_code}</p>
                    <p className="text-sm text-slate-400">{profile.employee.email}</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Organization</p>
                    <p className="text-white mt-2">{profile.employee.department}</p>
                    <p className="text-sm text-slate-400">{profile.employee.team_name ?? 'General'}</p>
                    <p className="text-sm text-slate-400">Manager: {profile.employee.manager ?? 'Not assigned'}</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Performance</p>
                    <p className="text-3xl font-bold text-emerald-300 mt-2">{profile.employee.performance_score}</p>
                    <p className="text-sm text-slate-400">{profile.employee.year_exp} years experience</p>
                    <p className="text-sm text-slate-400">Joined {toInputDate(profile.employee.join_date) || 'N/A'}</p>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-white">Skill List</h3>
                    <span className="text-sm text-slate-400">{profile.skills.length} assigned skills</span>
                  </div>
                  {profile.skills.length === 0 ? (
                    <p className="text-slate-400">No skills assigned yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.skills.map((skill) => (
                        <div key={`${profile.employee.id}-${skill.skill_id}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{skill.skill_name}</p>
                              <p className="text-xs text-slate-400 mt-1">{skill.category}</p>
                            </div>
                            <span className="px-2 py-1 rounded-lg text-xs bg-cyan-500/20 text-cyan-100 border border-cyan-400/25">
                              {skill.proficiency_label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Training History</h3>
                      <p className="text-sm text-slate-400">Track planned, in-progress, and completed upskilling.</p>
                    </div>
                    {canManage && (
                      <button className="btn-secondary px-4 py-2 inline-flex items-center gap-2" onClick={() => setShowTrainingForm((value) => !value)}>
                        <GraduationCap size={16} />
                        {showTrainingForm ? 'Hide Form' : 'Add Training'}
                      </button>
                    )}
                  </div>

                  {showTrainingForm && canManage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
                      <input className="input-modern px-3 py-2" placeholder="Training Name" value={trainingForm.training_name} onChange={(e) => setTrainingForm({ ...trainingForm, training_name: e.target.value })} />
                      <input className="input-modern px-3 py-2" placeholder="Provider" value={trainingForm.provider} onChange={(e) => setTrainingForm({ ...trainingForm, provider: e.target.value })} />
                      <input className="input-modern px-3 py-2" placeholder="Focus Skill" value={trainingForm.focus_skill} onChange={(e) => setTrainingForm({ ...trainingForm, focus_skill: e.target.value })} />
                      <select className="select-modern px-3 py-2" value={trainingForm.status} onChange={(e) => setTrainingForm({ ...trainingForm, status: e.target.value })}>
                        <option value="Planned">Planned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <input type="number" className="input-modern px-3 py-2" placeholder="Duration Hours" value={trainingForm.duration_hours} onChange={(e) => setTrainingForm({ ...trainingForm, duration_hours: e.target.value })} />
                      <input type="date" className="input-modern px-3 py-2" value={trainingForm.completion_date} onChange={(e) => setTrainingForm({ ...trainingForm, completion_date: e.target.value })} />
                      <div className="md:col-span-2 flex justify-end gap-3">
                        <button className="btn-secondary px-4 py-2" onClick={() => { setTrainingForm(emptyTrainingForm); setShowTrainingForm(false); }}>Cancel</button>
                        <button className="btn-primary px-4 py-2" onClick={() => void handleAddTraining()} disabled={submitting}>
                          {submitting ? 'Saving...' : 'Save Training'}
                        </button>
                      </div>
                    </div>
                  )}

                  {profile.training_history.length === 0 ? (
                    <p className="text-slate-400">No training history recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.training_history.map((training) => (
                        <div key={training.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-semibold text-white">{training.training_name}</p>
                              <p className="text-sm text-slate-400 mt-1">{training.provider ?? 'Internal Academy'} • {training.focus_skill ?? 'General Upskilling'}</p>
                            </div>
                            <span className="px-2 py-1 rounded-lg text-xs bg-emerald-500/20 text-emerald-100 border border-emerald-400/25">
                              {training.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {training.duration_hours ? `${training.duration_hours} hours` : 'Flexible duration'}
                            {training.completion_date ? ` • ${toInputDate(training.completion_date)}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
