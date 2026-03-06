import { useEffect, useState } from 'react';
import { Plus, Search, X, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function Employees() {
  const { employees, loadingEmployees, fetchEmployees, addEmployee } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', department: '', role: '', year_exp: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    if (success) {
      setForm({ name: '', department: '', role: '', year_exp: '' });
      setShowAdd(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-sm text-slate-400 mt-1">{employees.length} total employees</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="Search by name or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Experience</th>
            </tr>
          </thead>
          <tbody>
            {loadingEmployees ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                  <td className="px-4 py-3 text-slate-400">{emp.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{emp.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{emp.role}</td>
                  <td className="px-4 py-3 text-slate-400">{emp.year_exp} years</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add New Employee</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Department</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Engineering"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Senior Developer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Years of Experience</label>
                <input
                  type="number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="5"
                  value={form.year_exp}
                  onChange={(e) => setForm({ ...form, year_exp: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                  onClick={handleAdd}
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
