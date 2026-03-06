import { useEffect, useState } from 'react';
import { Plus, Zap, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Skills() {
  const { skills, employees, loadingSkills, fetchSkills, fetchEmployees } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ skill_name: '', category: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', skill_id: '', proficiency_level: '2' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
    fetchEmployees();
  }, []);

  const handleAdd = async () => {
    if (!form.skill_name || !form.category) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.addSkill(form);
      toast.success('Skill added!');
      fetchSkills();
      setForm({ skill_name: '', category: '' });
      setShowAdd(false);
    } catch {
      toast.error('Failed to add skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.employee_id || !assignForm.skill_id) {
      toast.error('Please select employee and skill');
      return;
    }
    setSubmitting(true);
    try {
      await api.assignSkill({
        employee_id: parseInt(assignForm.employee_id),
        skill_id: parseInt(assignForm.skill_id),
        proficiency_level: parseInt(assignForm.proficiency_level),
      });
      toast.success('Skill assigned!');
      setAssignForm({ employee_id: '', skill_id: '', proficiency_level: '2' });
      setShowAssign(false);
    } catch {
      toast.error('Failed to assign skill');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Skills</h1>
          <p className="text-sm text-slate-400 mt-1">{skills.length} skills in {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            onClick={() => setShowAssign(true)}
          >
            Assign Skill
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={16} /> Add Skill
          </button>
        </div>
      </div>

      {/* Skills Grid */}
      {loadingSkills ? (
        <div className="text-slate-400">Loading...</div>
      ) : skills.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
          No skills added yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-slate-500">#{skill.id}</span>
              </div>
              <h3 className="text-white font-medium mb-2">{skill.skill_name}</h3>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                {skill.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add New Skill</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Skill Name</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="React.js"
                  value={form.skill_name}
                  onChange={(e) => setForm({ ...form, skill_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Frontend"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                  {submitting ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Skill Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Assign Skill to Employee</h2>
              <button onClick={() => setShowAssign(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Employee</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={assignForm.employee_id}
                  onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Skill</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={assignForm.skill_id}
                  onChange={(e) => setAssignForm({ ...assignForm, skill_id: e.target.value })}
                >
                  <option value="">Select Skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.skill_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Proficiency Level (1-4)</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={assignForm.proficiency_level}
                  onChange={(e) => setAssignForm({ ...assignForm, proficiency_level: e.target.value })}
                >
                  <option value="1">1 - Beginner</option>
                  <option value="2">2 - Intermediate</option>
                  <option value="3">3 - Advanced</option>
                  <option value="4">4 - Expert</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  onClick={() => setShowAssign(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                  onClick={handleAssign}
                  disabled={submitting}
                >
                  {submitting ? 'Assigning...' : 'Assign Skill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
