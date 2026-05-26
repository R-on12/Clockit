import React, { useState } from 'react';
import { Calendar, ChevronRight, Sparkles, Moon, Footprints, Droplet, TrendingUp, BookOpen, Clock } from 'lucide-react';
import { VitalState, Reflection } from '../types';

interface InsightsViewProps {
  vitalState: VitalState;
  reflections: Reflection[];
  userName?: string;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ vitalState, reflections, userName = 'Ronnie' }) => {
  const [activeSegment, setActiveSegment] = useState<'vitality' | 'journal'>('vitality');

  // Calculates percentage completions
  const sleepPct = Math.round((vitalState.sleep.current / vitalState.sleep.target) * 100);
  const stepsPct = Math.round((vitalState.steps.current / vitalState.steps.target) * 100);
  const waterPct = Math.round((vitalState.water.current / vitalState.water.target) * 100);

  return (
    <div className="space-y-8 py-6 animate-fade-in" id="insights-parent-view">
      {/* Page Title */}
      <section className="mb-4">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight leading-tight">
          Vitality & Insights
        </h1>
        <p className="mt-2 text-on-surface-variant font-body text-sm leading-relaxed tracking-wide">
          Your holistic wellness timeline. Review biometric goals and historic reflection logs.
        </p>
      </section>

      {/* Segment Switcher */}
      <section className="flex bg-surface-container-low rounded-2xl p-1 shadow-inner">
        <button
          onClick={() => setActiveSegment('vitality')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider font-label rounded-xl transition-all ${
            activeSegment === 'vitality'
              ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/10'
              : 'text-outline hover:text-primary'
          }`}
          id="tab-insights-vitality"
        >
          <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Biometrics
        </button>
        <button
          onClick={() => setActiveSegment('journal')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider font-label rounded-xl transition-all ${
            activeSegment === 'journal'
              ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/10'
              : 'text-outline hover:text-primary'
          }`}
          id="tab-insights-journal"
        >
          <BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Reflections ({reflections.length})
        </button>
      </section>

      {/* Segment contents */}
      {activeSegment === 'vitality' ? (
        <div className="space-y-6" id="insights-biometrics-panel">
          {/* Main summary score card */}
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary-fixed/30 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest block font-label">Alignment Index</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-extrabold text-primary">71%</span>
                <span className="text-xs text-outline font-label">harmony score today</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm font-body">
                "Small, patient improvements in steps and hydration will fully normalize your diurnal sleep rhythm."
              </p>
            </div>
          </div>

          {/* Biometrics List with beautiful graphs / details */}
          <div className="space-y-4">
            {/* Sleep Progress Row */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Sleep Balance</h3>
                    <span className="text-[10px] text-outline uppercase tracking-wider font-label">Target: {vitalState.sleep.target} hours</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-headline font-semibold text-primary">{vitalState.sleep.current}h</span>
                  <span className="text-[10px] text-outline uppercase tracking-wider font-label block">{sleepPct}% Logged</span>
                </div>
              </div>
              <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${sleepPct}%` }} />
              </div>
              <p className="text-xs text-outline font-body leading-relaxed flex items-center gap-1.5 bg-surface-container-low/50 p-2.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                Your REM cycles peaked between 02:15 AM and 04:30 AM, establishing key centering.
              </p>
            </div>

            {/* Steps Progress Row */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Daily Steps</h3>
                    <span className="text-[10px] text-outline uppercase tracking-wider font-label">Target: {vitalState.steps.target}k steps</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-headline font-semibold text-primary">{vitalState.steps.current}k</span>
                  <span className="text-[10px] text-outline uppercase tracking-wider font-label block">{stepsPct}% Logged</span>
                </div>
              </div>
              <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${stepsPct}%` }} />
              </div>
              <p className="text-xs text-outline font-body leading-relaxed flex items-center gap-1.5 bg-surface-container-low/50 p-2.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                Active minutes peaked during your afternoon park amble. Heart health is nicely dialed in.
              </p>
            </div>

            {/* Water Progress Row */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Hydration Target</h3>
                    <span className="text-[10px] text-outline uppercase tracking-wider font-label">Target: {vitalState.water.target} liters</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-headline font-semibold text-primary">{vitalState.water.current}L</span>
                  <span className="text-[10px] text-outline uppercase tracking-wider font-label block">{waterPct}% Logged</span>
                </div>
              </div>
              <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${waterPct}%` }} />
              </div>
              <p className="text-xs text-outline font-body leading-relaxed flex items-center gap-1.5 bg-surface-container-low/50 p-2.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                Drink 0.8L more before nightfall to prevent midnight thirst and promote deep sleep.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Reflections segment - lists written journal text entries */
        <div className="space-y-6" id="insights-reflections-panel">
          {reflections.length > 0 ? (
            <div className="space-y-6 pb-20">
              {reflections.map((ref) => (
                <div 
                  key={ref.id} 
                  className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 relative overflow-hidden"
                  id={`saved-reflection-${ref.id}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-center text-outline">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs uppercase font-label tracking-widest font-semibold text-primary">Logged Pause</span>
                      </div>
                      <span className="text-xs font-label">{ref.date}</span>
                    </div>
                    <div>
                      <h4 className="text-xs text-outline font-semibold tracking-wider font-label uppercase">Daily Prompt:</h4>
                      <p className="mt-1 text-sm font-bold text-primary font-headline italic leading-relaxed">
                        {ref.prompt}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-outline-variant/10">
                      <h4 className="text-xs text-outline font-semibold tracking-wider font-label uppercase">{userName}'s Response:</h4>
                      <p className="mt-1.5 text-sm text-on-surface-variant font-body leading-relaxed">
                        "{ref.response}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-container-low/30 rounded-3xl border border-dashed border-outline-variant/40">
              <Sparkles className="w-10 h-10 mx-auto text-outline/60 mb-3 animate-pulse" />
              <h3 className="font-headline font-semibold text-primary text-base">Journal Haven is Still</h3>
              <p className="mt-2 text-sm text-outline font-body px-8 leading-relaxed max-w-sm mx-auto">
                Select your chat with Julian M., begin your first reflection pause, and let your insights dwell here beautifully.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
