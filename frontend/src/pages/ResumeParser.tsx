import { BrainCircuit, FileText, Upload, UserRoundPlus } from 'lucide-react';
import ResumeUpload from '@/components/ResumeUpload';

const journeySteps = [
  {
    title: 'Upload Resume',
    detail: 'Ingest PDF or TXT candidate resumes directly into the parser.',
    accent: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
  },
  {
    title: 'Extract Skills',
    detail: 'Parse named skills, experience, and known workforce signals using NLP.',
    accent: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  },
  {
    title: 'Create Employee',
    detail: 'Review the extracted profile, enrich missing metadata, and save it to the platform.',
    accent: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  },
];

export default function ResumeParser() {
  return (
    <div className="page-shell space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="glass-panel p-6 md:p-8 space-y-6 overflow-hidden relative">
          <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_65%)] pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
              <Upload size={14} />
              AI Resume Intake
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-display font-bold text-white">
              Parse resumes into workforce-ready employee profiles
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-300/90">
              Turn inbound resumes into structured employee records with extracted skills, experience, and assignment-ready metadata.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <FileText className="w-5 h-5 text-cyan-300" />
              <p className="mt-4 text-2xl font-bold text-white">PDF/TXT</p>
              <p className="mt-1 text-sm text-slate-400">Supported candidate upload formats</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <BrainCircuit className="w-5 h-5 text-amber-300" />
              <p className="mt-4 text-2xl font-bold text-white">NLP</p>
              <p className="mt-1 text-sm text-slate-400">Skill extraction and experience detection</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <UserRoundPlus className="w-5 h-5 text-emerald-300" />
              <p className="mt-4 text-2xl font-bold text-white">1 Flow</p>
              <p className="mt-1 text-sm text-slate-400">From upload to employee creation</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Process</p>
            <h2 className="mt-2 text-xl font-semibold text-white">How this workflow fits hiring intake</h2>
          </div>

          <div className="space-y-3">
            {journeySteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${step.accent}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ResumeUpload />
    </div>
  );
}
