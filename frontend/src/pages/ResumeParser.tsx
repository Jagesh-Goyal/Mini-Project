import React from "react";
import { Upload } from "lucide-react";
import ResumeUpload from "../components/ResumeUpload";

export const ResumePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Upload className="w-8 h-8" />
          Resume Parser
        </h1>
        <p className="text-slate-400">
          Upload resumes and automatically extract skills using NLP
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 border border-blue-700">
          <h3 className="text-lg font-semibold text-white mb-2">📄 Supported Formats</h3>
          <p className="text-blue-200 text-sm">
            Upload PDF or TXT resume files. NLP automatically extracts skills.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-4 border border-purple-700">
          <h3 className="text-lg font-semibold text-white mb-2">🧠 Skill Detection</h3>
          <p className="text-purple-200 text-sm">
            Recognizes 50+ skills including programming, cloud, DevOps, AI/ML.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-4 border border-green-700">
          <h3 className="text-lg font-semibold text-white mb-2">⚡ Quick Setup</h3>
          <p className="text-green-200 text-sm">
            One-click employee creation with auto-assigned skills and experience.
          </p>
        </div>
      </div>

      {/* Main Component */}
      <ResumeUpload />

      {/* How It Works */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <p className="text-white font-semibold">Upload Resume</p>
              <p className="text-slate-400 text-sm">PDF or TXT format</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <p className="text-white font-semibold">NLP Extraction</p>
              <p className="text-slate-400 text-sm">System extracts skills, experience, name</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <p className="text-white font-semibold">Review & Create</p>
              <p className="text-slate-400 text-sm">Confirm details and create employee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;
