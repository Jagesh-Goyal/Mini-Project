import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, User, Briefcase, Building2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '@/store/useStore';
import { getEmployeeSkills } from '@/lib/api';
import type { EmployeeSkillsResponse, Employee } from '@/types';
import {
  PageWrapper,
  Modal,
  Badge,
  SkeletonRow,
  EmptyState,
} from '@/components/ui';
import toast from 'react-hot-toast';

export default function Employees() {
  const { employees, loadingEmployees, fetchEmployees, addEmployee } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empSkills, setEmpSkills] = useState<EmployeeSkillsResponse | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: '', department: '', role: '', year_exp: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departments = [...new Set(employees.map((e) => e.department))];

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter ? e.department === deptFilter : true;
    return matchSearch && matchDept;
  });

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
    if (success) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setForm({ name: '', department: '', role: '', year_exp: '' });
      setShowAdd(false);
    }
  };

  const handleRowClick = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setLoadingSkills(true);
    try {
      const res = await getEmployeeSkills(emp.id);
      setEmpSkills(res.data);
    } catch {
      toast.error('Failed to load employee skills');
    } finally {
      setLoadingSkills(false);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Employees</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your workforce — {employees.length} total
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-glass pl-10 w-full"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-glass sm:w-48"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static overflow-hidden"
      >
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.06]">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Department</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Experience</div>
        </div>

        {/* Table Body */}
        {loadingEmployees ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No employees found" icon={User} />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((emp, i) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleRowClick(emp)}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 text-sm hover:bg-white/[0.03] transition cursor-pointer group"
              >
                <div className="col-span-1 text-slate-500">{emp.id}</div>
                <div className="col-span-3 font-medium text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{emp.name}</span>
                </div>
                <div className="col-span-3 text-slate-300 flex items-center">
                  <Badge text={emp.department} color="cyan" />
                </div>
                <div className="col-span-3 text-slate-300 truncate">{emp.role}</div>
                <div className="col-span-2 text-slate-400">{emp.year_exp} yrs</div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAdd && (
          <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="input-glass pl-10"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Department</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="input-glass pl-10"
                    placeholder="Engineering"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Role</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="input-glass pl-10"
                    placeholder="Senior Developer"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Years of Experience</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    className="input-glass pl-10"
                    placeholder="5"
                    value={form.year_exp}
                    onChange={(e) => setForm({ ...form, year_exp: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button className="btn-primary flex-1 justify-center" onClick={handleAdd} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Employee Skills Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <Modal
            open={!!selectedEmployee}
            onClose={() => {
              setSelectedEmployee(null);
              setEmpSkills(null);
            }}
            title={`Employee Skills — ${selectedEmployee.name}`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="glass-card-static p-3 rounded-xl">
                  <p className="text-slate-500 text-xs">Department</p>
                  <p className="text-white font-medium mt-0.5">{selectedEmployee.department}</p>
                </div>
                <div className="glass-card-static p-3 rounded-xl">
                  <p className="text-slate-500 text-xs">Role</p>
                  <p className="text-white font-medium mt-0.5">{selectedEmployee.role}</p>
                </div>
                <div className="glass-card-static p-3 rounded-xl">
                  <p className="text-slate-500 text-xs">Experience</p>
                  <p className="text-white font-medium mt-0.5">{selectedEmployee.year_exp} years</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Skills & Proficiency</h4>
                {loadingSkills ? (
                  <div className="space-y-2">
                    <div className="skeleton h-8 w-full rounded-lg" />
                    <div className="skeleton h-8 w-full rounded-lg" />
                  </div>
                ) : empSkills && empSkills.skills.length > 0 ? (
                  <div className="space-y-2">
                    {empSkills.skills.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                      >
                        <span className="text-sm text-white">{s.skill_name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(s.proficiency_level / 10) * 100}%` }}
                              transition={{ delay: 0.2 + i * 0.1 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-6 text-right">
                            {s.proficiency_level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-4 text-center">No skills assigned yet</p>
                )}
              </div>

              <button
                className="btn-secondary w-full justify-center"
                onClick={() => {
                  setSelectedEmployee(null);
                  setEmpSkills(null);
                }}
              >
                <X size={16} /> Close
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
