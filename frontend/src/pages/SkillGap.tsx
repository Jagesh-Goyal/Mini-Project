import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import * as api from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function SkillGap() {
  const { skills } = useStore();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [requiredCount, setRequiredCount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedSkill || !requiredCount) {
      toast.error('Please select skill and enter required count');
      return;
    }

    setLoading(true);
    try {
      const res = await api.calculateSkillGap({
        skill_name: selectedSkill,
        required_count: parseInt(requiredCount),
      });
      setResult(res.data);
      toast.success('Gap analysis complete');
    } catch (error) {
      toast.error('Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-amber-300" />
        <h1 className="text-3xl font-bold text-white font-display">Skill Gap Analysis</h1>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Analyze Demand vs Supply</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="select-modern px-4 py-2.5"
            >
              <option value="">Choose a skill</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.skill_name}>
                  {skill.skill_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Required Count
            </label>
            <input
              type="number"
              value={requiredCount}
              onChange={(e) => setRequiredCount(e.target.value)}
              placeholder="How many needed?"
              className="input-modern px-4 py-2.5"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-accent px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Gap'}
        </button>
      </div>

      {result && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Analysis Result</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Skill</p>
              <p className="text-xl font-bold text-white">{result.skill_name}</p>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Current</p>
              <p className="text-xl font-bold text-blue-400">{result.current}</p>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Required</p>
              <p className="text-xl font-bold text-amber-300">{result.required}</p>
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-lg border ${
            result.gap > 0 
              ? 'bg-red-900/20 border-red-700' 
              : 'bg-green-900/20 border-green-700'
          }`}>
            <p className="text-sm text-slate-400 mb-1">Gap</p>
            <p className={`text-2xl font-bold ${
              result.gap > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {result.gap > 0 ? `${result.gap} shortage` : 'No gap'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
