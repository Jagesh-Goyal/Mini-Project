import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import * as api from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import type { StrategicRecommendation, UpskillingRecommendationsResponse } from '@/types';

export default function Recommendations() {
  const { skills, fetchSkills } = useStore();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [requiredCount, setRequiredCount] = useState('');
  const [result, setResult] = useState<StrategicRecommendation | null>(null);
  const [orgRecommendations, setOrgRecommendations] = useState<UpskillingRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchSkills();
    void loadUpskillingRecommendations();
  }, []);

  const loadUpskillingRecommendations = async () => {
    try {
      const response = await api.getUpskillingRecommendations();
      setOrgRecommendations(response.data);
    } catch {
      toast.error('Failed to fetch upskilling recommendations');
    }
  };

  const handleGetRecommendation = async () => {
    if (!selectedSkill || !requiredCount) {
      toast.error('Please select skill and enter required count');
      return;
    }

    setLoading(true);
    try {
      const res = await api.getRecommendation(selectedSkill, parseInt(requiredCount));
      setResult(res.data);
      toast.success('Recommendation generated');
    } catch (error) {
      toast.error('Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('No action')) return 'text-green-400 bg-green-900/20 border-green-700';
    if (rec.includes('Upskill')) return 'text-blue-400 bg-blue-900/20 border-blue-700';
    if (rec.includes('Hire + Upskill')) return 'text-orange-300 bg-orange-900/20 border-orange-700';
    return 'text-red-400 bg-red-900/20 border-red-700';
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-8 h-8 text-amber-300" />
        <h1 className="text-3xl font-bold text-white font-display">Recommendations</h1>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Get Strategic Recommendations</h2>

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
              placeholder="Future requirement"
              className="input-modern px-4 py-2.5"
            />
          </div>
        </div>

        <button
          onClick={handleGetRecommendation}
          disabled={loading}
          className="btn-accent px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Get Recommendation'}
        </button>
      </div>

      {result && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Strategic Action Plan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Skill</p>
              <p className="text-xl font-bold text-white">{result.skill}</p>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Current Supply</p>
              <p className="text-xl font-bold text-blue-400">{result.current}</p>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Future Demand</p>
              <p className="text-xl font-bold text-amber-300">{result.required}</p>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${getRecommendationColor(result.recommendation)}`}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium mb-2">Recommended Action</p>
                <p className="text-xl font-bold">{result.recommendation}</p>
                {result.gap > 0 && (
                  <p className="text-sm mt-2 opacity-80">
                    Gap of {result.gap} employee{result.gap > 1 ? 's' : ''} identified
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="glass-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Hire</p>
              <p className="text-3xl font-bold text-rose-300 mt-2">{result.hire_count}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Upskill</p>
              <p className="text-3xl font-bold text-cyan-300 mt-2">{result.upskill_count}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Internal Transfer</p>
              <p className="text-3xl font-bold text-amber-300 mt-2">{result.transfer_count}</p>
            </div>
          </div>

          {result.decision_scores && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="glass-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Hire Pressure</p>
                <p className="text-2xl font-bold text-rose-300 mt-2">{result.decision_scores.hire_pressure}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Upskill Fit</p>
                <p className="text-2xl font-bold text-cyan-300 mt-2">{result.decision_scores.upskill_fit}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Transfer Readiness</p>
                <p className="text-2xl font-bold text-amber-300 mt-2">{result.decision_scores.transfer_readiness}</p>
              </div>
            </div>
          )}

          {result.decision_rationale && result.decision_rationale.length > 0 && (
            <div className="glass-card p-4 mt-4">
              <h3 className="text-white font-semibold mb-2">Decision Rationale</h3>
              <ul className="space-y-1">
                {result.decision_rationale.map((item, index) => (
                  <li key={`${item}-${index}`} className="text-sm text-slate-300 list-disc ml-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            <div className="glass-card p-4">
              <h3 className="text-white font-semibold mb-3">Internal Transfer Candidates</h3>
              {result.internal_transfer_candidates.length === 0 ? (
                <p className="text-slate-400 text-sm">No transfer candidates identified.</p>
              ) : (
                <div className="space-y-3">
                  {result.internal_transfer_candidates.map((candidate) => (
                    <div key={`transfer-${candidate.employee_id}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="text-white font-medium">{candidate.employee_name}</p>
                      <p className="text-xs text-slate-400 mt-1">{candidate.department} • {candidate.team_name ?? 'General'} • {candidate.proficiency_label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-4">
              <h3 className="text-white font-semibold mb-3">Upskill Candidates</h3>
              {result.upskill_candidates.length === 0 ? (
                <p className="text-slate-400 text-sm">No upskill candidates identified.</p>
              ) : (
                <div className="space-y-3">
                  {result.upskill_candidates.map((candidate) => (
                    <div key={`upskill-${candidate.employee_id}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="text-white font-medium">{candidate.employee_name}</p>
                      <p className="text-xs text-slate-400 mt-1">{candidate.department} • {candidate.team_name ?? 'General'} • Score {candidate.performance_score}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Training & Upskilling Recommendations</h2>
            <p className="text-sm text-slate-400 mt-1">Suggested learning paths to close the organization’s top capability gaps.</p>
          </div>
          <button className="btn-secondary px-4 py-2" onClick={() => void loadUpskillingRecommendations()}>
            Refresh
          </button>
        </div>

        {!orgRecommendations ? (
          <p className="text-slate-400">Loading recommendations...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {orgRecommendations.high_gap_skills.map((gap) => (
                <span key={gap.skill} className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/25 text-amber-100 text-sm">
                  {gap.skill} • gap {gap.gap}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orgRecommendations.recommendations.map((recommendation) => (
                <div key={`rec-${recommendation.employee_id}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{recommendation.employee_name}</p>
                      <p className="text-xs text-slate-400 mt-1">{recommendation.department}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-xs bg-cyan-500/15 border border-cyan-400/25 text-cyan-100">
                      {recommendation.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-3">{recommendation.rationale}</p>
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mb-2">Current Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.current_skills.map((skill) => (
                        <span key={`${recommendation.employee_id}-${skill}`} className="px-2 py-1 rounded-lg bg-white/6 border border-white/10 text-slate-200 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mb-2">Recommended Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.recommended_skills.map((skill) => (
                        <span key={`${recommendation.employee_id}-target-${skill}`} className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/25 text-emerald-100 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
