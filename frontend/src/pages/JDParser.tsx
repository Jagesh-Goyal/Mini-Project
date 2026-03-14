import { useState } from 'react';
import { ClipboardList, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import * as api from '@/lib/api';
import type { JDSkillAnalysis } from '@/lib/api';
import toast from 'react-hot-toast';

const SAMPLE_JD = `We are looking for a Senior Full Stack Engineer with strong experience in Python and React.
The ideal candidate should have hands-on knowledge of AWS, Docker, and Kubernetes for cloud deployments.
Experience with PostgreSQL and Redis is required. Familiarity with Machine Learning and CI/CD pipelines is a plus.
The candidate should be comfortable working in Agile teams and have solid REST API design skills.`;

export default function JDParser() {
  const [jdText, setJdText]     = useState('');
  const [result, setResult]     = useState<{ total_skills_found: number; total_matched_in_db: number; skill_analysis: JDSkillAnalysis[] } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState<'all' | 'matched' | 'unmatched'>('all');

  const handleParse = async () => {
    if (!jdText.trim() || jdText.trim().length < 20) {
      toast.error('Please paste a job description (min 20 characters)');
      return;
    }
    setLoading(true);
    try {
      const res = await api.parseJobDescription(jdText.trim());
      setResult(res.data);
      toast.success(`Found ${res.data.total_skills_found} skills, ${res.data.total_matched_in_db} in your database`);
    } catch {
      toast.error('Parsing failed — check server connection');
    } finally {
      setLoading(false);
    }
  };

  const filtered = result?.skill_analysis.filter((s) => {
    if (filter === 'matched')   return s.in_database;
    if (filter === 'unmatched') return !s.in_database;
    return true;
  }) ?? [];

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-8 h-8 text-emerald-300" />
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Job Description Parser</h1>
          <p className="text-sm text-slate-400 mt-0.5">Extract required skills from any JD and compare against your workforce</p>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Paste Job Description</h2>
          <button
            onClick={() => setJdText(SAMPLE_JD)}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition"
          >
            Load sample JD
          </button>
        </div>

        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={8}
          placeholder="Paste the full job description here..."
          className="input-modern px-4 py-3 resize-y font-mono text-sm"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleParse()}
            disabled={loading}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
          >
            <Search size={15} />
            {loading ? 'Extracting...' : 'Extract Skills'}
          </button>
          {result && (
            <button onClick={() => { setResult(null); setJdText(''); }} className="btn-secondary px-4 py-2.5 flex items-center gap-2">
              <RefreshCw size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Skills in JD</p>
              <p className="text-3xl font-bold text-white">{result.total_skills_found}</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Matched in DB</p>
              <p className="text-3xl font-bold text-emerald-300">{result.total_matched_in_db}</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Not in DB</p>
              <p className="text-3xl font-bold text-red-400">{result.total_skills_found - result.total_matched_in_db}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'matched', 'unmatched'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition capitalize
                  ${filter === f
                    ? 'bg-cyan-400/16 text-cyan-100 border-cyan-300/40'
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((skill) => (
              <div
                key={skill.skill_name}
                className={`glass-panel p-4 flex items-start gap-3 border ${
                  skill.in_database
                    ? 'border-emerald-500/30'
                    : 'border-red-500/20'
                }`}
              >
                {skill.in_database ? (
                  <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium capitalize truncate">{skill.skill_name}</p>
                  {skill.in_database ? (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {skill.current_count} employee{skill.current_count !== 1 ? 's' : ''} have this skill
                      {skill.current_count === 0 && (
                        <span className="ml-1 text-amber-400 font-medium">— Gap!</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-red-400 mt-0.5">Not tracked in your skill database</p>
                  )}
                </div>
                {skill.in_database && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    skill.current_count === 0
                      ? 'bg-red-500/20 text-red-300'
                      : skill.current_count < 3
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'bg-emerald-500/15 text-emerald-300'
                  }`}>
                    {skill.current_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
