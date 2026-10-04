import React from 'react';
import {
  Library,
  Car,
  Building2,
  Plane,
  FlaskConical,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  Target
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';
import { CLASSIC_CASES } from '../data/cases';

export const CaseLibraryTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { activeCaseId, loadCase } = useAhp();

  const caseIcons: Record<string, React.FC<{ className?: string }>> = {
    'car-purchase': Car,
    'supplier-selection': Building2,
    'travel-planning': Plane,
    'research-project': FlaskConical,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              经典案例库（Classic Decision Cases）
            </h1>
            <p className="text-xs text-stone-500">
              内置购车选优、供应商评定、旅游出行、科研立项四大经典实战场景，一键载入全套结构、判断矩阵与仿真数据。
            </p>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CLASSIC_CASES.map(c => {
          const Icon = caseIcons[c.id] || Sparkles;
          const isActive = activeCaseId === c.id;

          return (
            <div
              key={c.id}
              className={`p-6 rounded-2xl border transition-all duration-200 space-y-5 flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-700/10'
                  : 'bg-white border-stone-200/80 hover:border-stone-300 shadow-2xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                        {c.category}
                      </span>
                      <h3 className="text-base font-serif font-bold text-stone-900 mt-1">
                        {c.title}
                      </h3>
                    </div>
                  </div>

                  {isActive && (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>正在实验</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  {c.background}
                </p>

                {/* Case Specs */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-mono block">决策目标 (Goal)</span>
                    <span className="font-semibold text-stone-800">{c.goal}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/60">
                    <div>
                      <span className="text-[10px] text-stone-400 font-mono block">评价准则 ({c.criteria.length}项)</span>
                      <span className="text-stone-700 truncate block">
                        {c.criteria.map(x => x.name.split(' ')[0]).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-mono block">备选方案 ({c.alternatives.length}项)</span>
                      <span className="text-stone-700 truncate block">
                        {c.alternatives.map(x => x.name.split('（')[0]).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insight quote */}
                <p className="text-[11px] text-stone-500 italic">
                  💡 {c.authorNotes}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 font-mono">
                  内置完整 1-9 标度判断矩阵
                </span>

                <button
                  onClick={() => loadCase(c.id)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isActive ? '已载入当前模型' : '一键载入此案例'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          案例实践完毕。接下来可前往 AI 决策洞察切片，由大模型针对当前模型进行深入剖析与问答。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：AI 决策洞察（AI Insights）</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
