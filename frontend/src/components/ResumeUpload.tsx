import React, { useState } from "react";
import toast from "react-hot-toast";
import * as api from "@/lib/api";

interface ExtractedSkill {
  skill_name: string;
  skill_id: number;
}

interface ResumeData {
  name: string;
  experience_years: number;
  extracted_skills: string[];
  mapped_skills: ExtractedSkill[];
}

export const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState(3);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    department: "Engineering",
    role: "Engineer",
  });

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.type === "application/pdf" || droppedFile.type === "text/plain") {
        setFile(droppedFile);
      } else {
        alert("Please drop a PDF or TXT file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadResume = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    try {
      const response = await api.uploadResume(file);
      const payload = response.data;

      if (payload.status === "success") {
        setResumeData(payload);
        setEmployeeForm(prev => ({
          ...prev,
          name: payload.name || "Unknown"
        }));
        // Pre-select all mapped skills
        setSelectedSkills(
          payload.mapped_skills.map((s: ExtractedSkill) => s.skill_id)
        );
        toast.success(payload.message || "Resume processed successfully");
      } else {
        toast.error("Failed to process resume");
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.error;
      toast.error(detail || "Error uploading resume");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!resumeData) {
      toast.error("No resume data available");
      return;
    }

    if (!employeeForm.name.trim()) {
      toast.error("Please enter employee name");
      return;
    }

    setCreatingEmployee(true);
    try {
      const response = await api.createEmployeeFromResume({
        name: employeeForm.name || resumeData.name,
        department: employeeForm.department,
        role: employeeForm.role,
        experience_years: resumeData.experience_years,
        skill_ids: selectedSkills,
        proficiency_level: proficiencyLevel,
      });

      if (response.data.status === "success") {
        toast.success(response.data.message || "Employee created successfully");
        // Reset form
        setFile(null);
        setResumeData(null);
        setSelectedSkills([]);
        setEmployeeForm({
          name: "",
          department: "Engineering",
          role: "Engineer",
        });
      } else {
        toast.error("Failed to create employee");
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.error;
      toast.error(detail || "Error creating employee");
    } finally {
      setCreatingEmployee(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📤</span>
          Resume Upload & Skill Extraction
        </h2>

        {/* Drop Zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
        >
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="resume-input"
          />
          <label htmlFor="resume-input" className="cursor-pointer">
            <div className="text-5xl mx-auto mb-3">📄</div>
            <p className="text-white font-semibold mb-1">
              {file ? file.name : "Drop resume or click to browse"}
            </p>
            <p className="text-slate-400 text-sm">PDF or TXT format</p>
          </label>
        </div>

        {file && (
          <button
            onClick={handleUploadResume}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <span>📤</span>
                Upload & Extract Skills
              </>
            )}
          </button>
        )}
      </div>

      {/* Results Section */}
      {resumeData && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-lg">✅</span>
            <span className="font-semibold">Resume processed successfully!</span>
          </div>

          {/* Extracted Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-sm">Name</p>
              <p className="text-white font-semibold">{resumeData.name}</p>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-sm">Experience</p>
              <p className="text-white font-semibold">{resumeData.experience_years} years</p>
            </div>
            <div className="bg-slate-800 rounded p-3 col-span-2">
              <p className="text-slate-400 text-sm mb-2">Skills Found</p>
              <p className="text-white font-semibold">{resumeData.extracted_skills.length} skills</p>
              <p className="text-slate-300 text-sm mt-1">
                {resumeData.extracted_skills.join(", ")}
              </p>
            </div>
          </div>

          {/* Employee Form */}
          <div className="border-t border-slate-600 pt-4 mt-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">Create Employee</h3>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={employeeForm.name}
                onChange={e =>
                  setEmployeeForm({ ...employeeForm, name: e.target.value })
                }
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Department
                </label>
                <select
                  value={employeeForm.department}
                  onChange={e =>
                    setEmployeeForm({
                      ...employeeForm,
                      department: e.target.value,
                    })
                  }
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option>Engineering</option>
                  <option>Data Science</option>
                  <option>DevOps</option>
                  <option>Backend</option>
                  <option>Frontend</option>
                  <option>Security</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={employeeForm.role}
                  onChange={e =>
                    setEmployeeForm({ ...employeeForm, role: e.target.value })
                  }
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Default Proficiency Level: {proficiencyLevel}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={proficiencyLevel}
                onChange={e => setProficiencyLevel(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-slate-400 text-xs mt-1">
                {proficiencyLevel === 1 && "Beginner"}
                {proficiencyLevel === 2 && "Intermediate"}
                {proficiencyLevel === 3 && "Proficient"}
                {proficiencyLevel === 4 && "Advanced"}
                {proficiencyLevel === 5 && "Expert"}
              </p>
            </div>

            {/* Skill Selection */}
            {resumeData.mapped_skills.length > 0 && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Select Skills ({selectedSkills.length} selected)
                </label>
                <div className="bg-slate-800 rounded p-3 max-h-48 overflow-y-auto space-y-2">
                  {resumeData.mapped_skills.map(skill => (
                    <label key={skill.skill_id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.skill_id)}
                        onChange={() => toggleSkill(skill.skill_id)}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">{skill.skill_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* No skills found warning */}
            {resumeData.mapped_skills.length === 0 && (
              <div className="bg-amber-900/30 border border-amber-700 rounded p-3 flex gap-2 text-amber-300">
                <span className="text-lg">⚠️</span>
                <p className="text-sm">
                  No matching skills found in database. Add skills first before creating employee.
                </p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateEmployee}
              disabled={creatingEmployee || selectedSkills.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 mt-4"
            >
              {creatingEmployee ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Creating Employee...
                </>
              ) : (
                <>
                  <span className="text-lg">✅</span>
                  Create Employee & Assign Skills
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
