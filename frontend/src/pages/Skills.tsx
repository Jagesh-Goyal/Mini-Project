import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Zap, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import toast from 'react-hot-toast';

const currentRole = localStorage.getItem('userRole') ?? 'employee';
const canManage = currentRole === 'admin' || currentRole === 'hr_manager';

export default function Skills() {
  const { skills, employees, loadingSkills, fetchSkills, fetchEmployees } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [editSkillId, setEditSkillId] = useState<number | null>(null);
  const [form, setForm] = useState({ skill_name: '', category: '', description: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', skill_id: '', proficiency_level: '2' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
    fetchEmployees();
  }, []);

  const resetForm = () => setForm({ skill_name: '', category: '', description: '' });

  const filteredSkills = useMemo(() => skills, [skills]);

  const handleAdd = async () => {
    if (!form.skill_name || !form.category) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.addSkill({
        skill_name: form.skill_name,
        category: form.category,
        description: form.description || null,
      });
      toast.success(editSkillId ? 'Skill updated!' : 'Skill added!');
      fetchSkills();
      resetForm();
      setShowAdd(false);
      setEditSkillId(null);
    } catch {
      toast.error(editSkillId ? 'Failed to update skill' : 'Failed to add skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editSkillId) {
      await handleAdd();
      return;
    }

    if (!form.skill_name || !form.category) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateSkill(editSkillId, {
        skill_name: form.skill_name,
        category: form.category,
        description: form.description || null,
      });
      toast.success('Skill updated!');
      fetchSkills();
      resetForm();
      setEditSkillId(null);
      setShowAdd(false);
    } catch {
      toast.error('Failed to update skill');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (skillId: number) => {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;
    setEditSkillId(skill.id);
    setForm({
      skill_name: skill.skill_name,
      category: skill.category,
      description: skill.description ?? '',
    });
    setShowAdd(true);
  };

  const handleDelete = async (skillId: number, skillName: string) => {
    if (!confirm(`Delete skill ${skillName}?`)) return;
    try {
      await api.deleteSkill(skillId);
      toast.success('Skill deleted');
      fetchSkills();
    } catch {
      toast.error('Failed to delete skill');
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
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Skills</h1>
          <p className="text-sm text-slate-400 mt-1">{skills.length} skills in {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-accent flex items-center gap-2 px-4 py-2"
            onClick={() => setShowAssign(true)}
            disabled={!canManage}
          >
            Assign Skill
          </button>
          {canManage && (
            <button
              className="btn-primary flex items-center gap-2 px-4 py-2"
              onClick={() => { resetForm(); setEditSkillId(null); setShowAdd(true); }}
            >
              <Plus size={16} /> Add Skill
            </button>
          )}
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
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-slate-500">#{skill.id}</span>
                </div>
                {canManage && (
                  <div className="row-action-group">
                    <button type="button" className="row-action-btn" title="Edit skill" onClick={() => openEdit(skill.id)}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="row-action-btn text-red-400 hover:text-red-300" title="Delete skill" onClick={() => void handleDelete(skill.id, skill.skill_name)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-white font-medium mb-2">{skill.skill_name}</h3>
              <span className="px-2 py-1 bg-amber-500/20 text-amber-200 rounded text-xs">
                {skill.category}
              </span>
              <p className="text-sm text-slate-400 mt-3 min-h-[48px]">
                {skill.description ?? 'No description added yet.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="auth-card p-6 w-full max-w-md">
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
                  className="input-modern px-3 py-2"
                  placeholder="React.js"
                  value={form.skill_name}
                  onChange={(e) => setForm({ ...form, skill_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <input
                  className="input-modern px-3 py-2"
                  placeholder="Frontend"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  className="input-modern px-3 py-2 min-h-[96px]"
                  placeholder="Describe the skill, its business relevance, or expected outcomes"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  className="btn-secondary flex-1 px-4 py-2"
                  onClick={() => { setShowAdd(false); setEditSkillId(null); resetForm(); }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 px-4 py-2 disabled:opacity-50"
                  onClick={() => void (editSkillId ? handleUpdate() : handleAdd())}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editSkillId ? 'Save Changes' : 'Add Skill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Skill Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="auth-card p-6 w-full max-w-md">
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
                  className="select-modern px-3 py-2"
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
                  className="select-modern px-3 py-2"
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
                <label className="block text-sm text-slate-400 mb-1">Proficiency Level</label>
                <select
                  className="select-modern px-3 py-2"
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
                  className="btn-secondary flex-1 px-4 py-2"
                  onClick={() => setShowAssign(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-accent flex-1 px-4 py-2 disabled:opacity-50"
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
