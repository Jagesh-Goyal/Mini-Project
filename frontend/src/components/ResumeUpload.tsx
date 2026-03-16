import { useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  FileBadge2,
  FileUp,
  Loader2,
  Sparkles,
  Trash2,
  UserRoundPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '@/lib/api';

const proficiencyLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert',
};

const defaultEmployeeForm = {
  employee_code: '',
  name: '',
  email: '',
  department: 'Engineering',
  role: 'Engineer',
  manager: '',
  team_name: '',
  join_date: '',
  performance_score: '70',
};

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [resumeData, setResumeData] = useState<api.ResumeExtractionResult | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [proficiencyLevel, setProficiencyLevel] = useState(3);
  const [employeeForm, setEmployeeForm] = useState(defaultEmployeeForm);

  const selectedSkillNames = useMemo(() => {
    if (!resumeData) {
      return [];
    }

    return resumeData.mapped_skills
      .filter((skill) => selectedSkills.includes(skill.skill_id))
      .map((skill) => skill.skill_name);
  }, [resumeData, selectedSkills]);

  const resetFlow = () => {
    setFile(null);
    setResumeData(null);
    setSelectedSkills([]);
    setProficiencyLevel(3);
    setEmployeeForm(defaultEmployeeForm);
  };

  const acceptFile = (candidate: File) => {
    const validFile = candidate.type === 'application/pdf' || candidate.type === 'text/plain' || candidate.name.endsWith('.txt');
    if (!validFile) {
      toast.error('Please choose a PDF or TXT resume');
      return;
    }

    setFile(candidate);
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      acceptFile(droppedFile);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      acceptFile(selectedFile);
    }
  };

  const handleUploadResume = async () => {
    if (!file) {
      toast.error('Please select a resume file');
      return;
    }

    setLoading(true);
    try {
      const response = await api.uploadResume(file);
      const payload = response.data;

      if (payload.status !== 'success') {
        toast.error(payload.message || 'Resume processing failed');
        return;
      }

      setResumeData(payload);
      setSelectedSkills(payload.mapped_skills.map((skill) => skill.skill_id));
      setEmployeeForm((previous) => ({
        ...previous,
        name: payload.name || previous.name,
      }));
      toast.success(payload.message || 'Resume processed successfully');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.error;
      toast.error(detail || 'Error uploading resume');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!resumeData) {
      toast.error('No resume data available');
      return;
    }

    if (!employeeForm.name.trim()) {
      toast.error('Please enter a name before creating the employee');
      return;
    }

    setCreatingEmployee(true);
    try {
      const response = await api.createEmployeeFromResume({
        name: employeeForm.name.trim(),
        email: employeeForm.email.trim() || undefined,
        department: employeeForm.department,
        role: employeeForm.role,
        experience_years: resumeData.experience_years,
        proficiency_level: proficiencyLevel,
        employee_code: employeeForm.employee_code.trim() || undefined,
        join_date: employeeForm.join_date || null,
        manager: employeeForm.manager.trim() || null,
        performance_score: Number(employeeForm.performance_score || '70'),
        team_name: employeeForm.team_name.trim() || null,
        skill_ids: selectedSkills,
      });

      if (response.data.status !== 'success') {
        toast.error(response.data.message || 'Failed to create employee');
        return;
      }

      toast.success(
        response.data.employee_code
          ? `Employee ${response.data.employee_code} created successfully`
          : response.data.message || 'Employee created successfully'
      );
      resetFlow();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.error;
      toast.error(detail || 'Error creating employee');
    } finally {
      setCreatingEmployee(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills((previous) =>
      previous.includes(skillId)
        ? previous.filter((id) => id !== skillId)
        : [...previous, skillId]
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <div className="glass-panel p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Step 1</p>
            <h2 className="mt-2 text-2xl font-display font-bold text-white">Upload and extract</h2>
            <p className="mt-2 text-sm text-slate-400">
              Upload a resume to extract mapped skills, experience, and a starter employee profile.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
            <FileUp size={20} />
          </div>
        </div>

        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleFileDrop}
          className="rounded-3xl border border-dashed border-slate-600/80 bg-slate-950/45 p-8 text-center transition hover:border-cyan-400/40 hover:bg-cyan-500/5"
        >
          <input
            id="resume-input"
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="resume-input" className="block cursor-pointer">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
              <FileBadge2 size={28} />
            </div>
            <p className="mt-5 text-base font-semibold text-white">
              {file ? file.name : 'Drop a resume here or browse from disk'}
            </p>
            <p className="mt-2 text-sm text-slate-400">Accepted formats: PDF and TXT</p>
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">
          <div className="flex items-center gap-2 text-white">
            <BrainCircuit size={16} className="text-amber-300" />
            Extraction output
          </div>
          <p className="mt-2 text-slate-400">
            The parser uses the resume text to suggest known skills and experience, then lets you review and enrich the employee record before saving it.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleUploadResume()}
            disabled={!file || loading}
            className="btn-primary flex-1 px-4 py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Processing Resume...' : 'Extract Resume Data'}
          </button>
          <button
            type="button"
            onClick={resetFlow}
            className="btn-secondary px-4 py-2.5 inline-flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Step 2</p>
            <h2 className="mt-2 text-2xl font-display font-bold text-white">Review and create</h2>
            <p className="mt-2 text-sm text-slate-400">
              Confirm the extracted profile, tune mapped skills, and create a workforce record.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
            <UserRoundPlus size={20} />
          </div>
        </div>

        {!resumeData ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
            Upload a resume first to preview extracted skills and create an employee profile.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Candidate</p>
                <p className="mt-2 text-lg font-semibold text-white">{resumeData.name || 'Unknown'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Experience</p>
                <p className="mt-2 text-lg font-semibold text-white">{resumeData.experience_years} years</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Mapped Skills</p>
                <p className="mt-2 text-lg font-semibold text-white">{resumeData.mapped_skills.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Extracted Terms</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resumeData.extracted_skills.length > 0 ? (
                  resumeData.extracted_skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">No recognizable skill terms were extracted from this file.</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-slate-400">Employee ID</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.employee_code}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, employee_code: event.target.value })}
                  placeholder="EMP-0104"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Email</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.email}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })}
                  placeholder="candidate@company.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Name</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.name}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })}
                  placeholder="Candidate name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Job Role</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.role}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })}
                  placeholder="Platform Engineer"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Department</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.department}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, department: event.target.value })}
                  placeholder="Engineering"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Team</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.team_name}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, team_name: event.target.value })}
                  placeholder="Platform"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Manager</label>
                <input
                  className="input-modern px-3 py-2"
                  value={employeeForm.manager}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, manager: event.target.value })}
                  placeholder="Hiring manager"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Join Date</label>
                <input
                  type="date"
                  className="input-modern px-3 py-2"
                  value={employeeForm.join_date}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, join_date: event.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Performance Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-modern px-3 py-2"
                  value={employeeForm.performance_score}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, performance_score: event.target.value })}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Default proficiency</p>
                  <p className="text-xs text-slate-400 mt-1">Applies to the selected mapped skills during employee creation.</p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                  {proficiencyLabels[proficiencyLevel]}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(proficiencyLabels).map(([value, label]) => {
                  const numericValue = Number(value);
                  const active = proficiencyLevel === numericValue;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProficiencyLevel(numericValue)}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        active
                          ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Mapped skills</p>
                  <p className="text-xs text-slate-400 mt-1">Select the extracted skills you want assigned to this employee.</p>
                </div>
                <span className="text-xs text-slate-400">{selectedSkills.length} selected</span>
              </div>

              {resumeData.mapped_skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resumeData.mapped_skills.map((skill) => {
                    const selected = selectedSkills.includes(skill.skill_id);
                    return (
                      <button
                        key={skill.skill_id}
                        type="button"
                        onClick={() => toggleSkill(skill.skill_id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-50'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{skill.skill_name}</span>
                          {selected ? <CheckCircle2 size={16} className="text-emerald-300" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  No matching database skills were found. You can still create the employee and assign skills later.
                </div>
              )}

              {selectedSkillNames.length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mb-2">Selected skill list</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkillNames.map((skill) => (
                      <span key={skill} className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleCreateEmployee()}
              disabled={creatingEmployee}
              className="btn-primary w-full px-4 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creatingEmployee ? <Loader2 size={18} className="animate-spin" /> : <UserRoundPlus size={18} />}
              {creatingEmployee ? 'Creating Employee...' : 'Create Employee Record'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
