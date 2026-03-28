import { useMemo, useState } from 'react';
import { Bot, MessageSquare, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '@/lib/api';
import type { WorkforceAdvisorResponse } from '@/types';

type Scenario = 'conservative' | 'balanced' | 'aggressive';

type ChatTurn = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  payload?: WorkforceAdvisorResponse;
};

const starterQuestions = [
  'Which skills should we hire for in next 6 months?',
  'Where should we prioritize upskilling this quarter?',
  'What are the biggest workforce risks right now?',
];

export default function Advisor() {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [scenario, setScenario] = useState<Scenario>('balanced');
  const [useLLM, setUseLLM] = useState(true);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([]);

  const canAsk = query.trim().length >= 4 && !loading;

  const latestAssistantPayload = useMemo(
    () => [...chat].reverse().find((item) => item.role === 'assistant')?.payload,
    [chat]
  );

  const askAdvisor = async (prefilledQuery?: string) => {
    const finalQuery = (prefilledQuery ?? query).trim();
    if (finalQuery.length < 4) {
      toast.error('Please enter a meaningful question');
      return;
    }

    setLoading(true);

    const userTurn: ChatTurn = {
      id: Date.now(),
      role: 'user',
      content: finalQuery,
    };
    setChat((prev) => [...prev, userTurn]);

    try {
      const response = await api.queryWorkforceAdvisor({
        query: finalQuery,
        department: department || undefined,
        scenario,
        use_llm: useLLM,
      });

      const assistantTurn: ChatTurn = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.answer,
        payload: response.data,
      };

      setChat((prev) => [...prev, assistantTurn]);
      setQuery('');
    } catch {
      toast.error('Advisor request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-violet-300" />
        <div>
          <h1 className="text-3xl font-bold text-white font-display">AI Workforce Advisor</h1>
          <p className="text-sm text-slate-400 mt-1">Conversational assistant for hiring, upskilling, and workforce risk decisions.</p>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Ask your question</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canAsk) {
                  void askAdvisor();
                }
              }}
              placeholder="e.g., Should we hire or upskill for Kubernetes gap?"
              className="input-modern px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Department (optional)</label>
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="Engineering"
              className="input-modern px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Scenario</label>
            <select
              value={scenario}
              onChange={(event) => setScenario(event.target.value as Scenario)}
              className="select-modern px-4 py-2.5"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((question) => (
              <button
                key={question}
                className="btn-secondary px-3 py-1.5 text-sm"
                onClick={() => {
                  setQuery(question);
                  void askAdvisor(question);
                }}
                disabled={loading}
              >
                {question}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(event) => setUseLLM(event.target.checked)}
              />
              Use LLM when key available
            </label>
            <button
              onClick={() => void askAdvisor()}
              disabled={!canAsk}
              className="btn-primary px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={15} />
              {loading ? 'Thinking...' : 'Ask Advisor'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-panel p-5 space-y-4 min-h-[360px]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-300" />
            <h2 className="text-lg font-semibold text-white">Conversation</h2>
          </div>

          {chat.length === 0 ? (
            <div className="h-64 rounded-xl border border-white/10 bg-slate-900/45 flex items-center justify-center text-slate-400 text-sm px-6 text-center">
              Ask a workforce planning question to start the advisory conversation.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {chat.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-xl border p-4 ${
                    turn.role === 'user'
                      ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100'
                      : 'border-violet-400/25 bg-violet-500/10 text-violet-100'
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.14em] opacity-70 mb-2">
                    {turn.role === 'user' ? 'HR Query' : `Advisor (${turn.payload?.mode?.toUpperCase() ?? 'AI'})`}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-semibold text-white">Action Board</h2>
          </div>

          {!latestAssistantPayload ? (
            <p className="text-sm text-slate-400">No advisor output yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <KpiTile label="Employees" value={latestAssistantPayload.kpis.employees} />
                <KpiTile label="Critical" value={latestAssistantPayload.kpis.critical_gap_count} />
                <KpiTile label="Medium" value={latestAssistantPayload.kpis.medium_gap_count} />
              </div>

              <div className="space-y-2">
                {latestAssistantPayload.action_cards.map((card, index) => (
                  <div key={`${card.title}-${index}`} className="rounded-lg border border-white/10 bg-slate-900/55 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{card.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200">{card.priority}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">{card.action}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mb-2">Suggested Follow-ups</p>
                <ul className="space-y-1">
                  {latestAssistantPayload.follow_up_questions.map((followUp, index) => (
                    <li key={`${followUp}-${index}`} className="text-xs text-slate-300 list-disc ml-4">
                      {followUp}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/55 p-3 text-center">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
