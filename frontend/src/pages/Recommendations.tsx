import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import * as api from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function Recommendations() {
  const { skills } = useStore();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [requiredCount, setRequiredCount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    if (rec.includes('combination')) return 'text-orange-400 bg-orange-900/20 border-orange-700';
    return 'text-red-400 bg-red-900/20 border-red-700';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-8 h-8 text-yellow-500" />
        <h1 className="text-2xl font-bold text-white">Recommendations</h1>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Get Strategic Recommendations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleGetRecommendation}
          disabled={loading}
          className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Get Recommendation'}
        </button>
      </div>

      {result && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Strategic Action Plan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Skill</p>
              <p className="text-xl font-bold text-white">{result.skill}</p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Current Supply</p>
              <p className="text-xl font-bold text-blue-400">{result.current}</p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Future Demand</p>
              <p className="text-xl font-bold text-purple-400">{result.required}</p>
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
        </div>
      )}
    </div>
  );
}
