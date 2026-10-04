import React, { useEffect } from 'react';
import {
  Award,
  Trophy,
  Medal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAhp } from '../context/AhpContext';

export const SynthesisTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { model, synthesisResult, activeMethod } = useAhp();

  const { criteriaWeights, altLocalWeights, globalScores, hierarchyCr, isHierarchyConsistent } =
    synthesisResult;

  const sortedScores = [...globalScores].sort((a, b) => b.score - a.score);
  const bestAlt = sortedScores[0];

  useEffect(() => {
    // Trigger lightweight celebratory confetti on mount if consistent
    if (isHierarchyConsistent && globalScores.length > 0) {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#047857', '#0d9488', '#0f766e'],
        });
      } catch (e) {
        // ignore in non-browser or sandbox
      }
    }
  }, [isHierarchyConsistent]);

  // Color palette for criteria contributions in stacked bar
  const criteriaColors = [
    'bg-emerald-600',
    'bg-teal-600',
    'bg-sky-600',
    'bg-indigo-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-violet-600',
    'bg-cyan-600',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              权重合成与方案排序（Weight Synthesis & Ranking）
            </h1>
            <p className="text-xs text-stone-500">
              自顶向下将准则层全局权重与各方案在各准则下的局部权重做点积乘积累加：
              <span className="font-mono text-emerald-900 font-semibold">
                {' '}
                S_i = Σ (W_j × P_ij){' '}
              </span>
              ，生成最终优先级排序与组合一致性指标。
            </p>
          </div>

          {/* Hierarchy CR status */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium border ${
              isHierarchyConsistent
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            {isHierarchyConsistent ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <div>
              <span className="block text-[10px] text-stone-500 font-sans">
                全层次总一致性 (CR_total)
              </span>
              <span className="font-bold">
                {hierarchyCr.toFixed(4)}{' '}
                {isHierarchyConsistent ? '【整体协调合格】' : '【整体超标】'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 Alternatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedScores.slice(0, 3).map((item, idx) => {
          const isWinner = idx === 0;
          return (
            <div
              key={item.altId}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                isWinner
                  ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-stone-900 text-white border-emerald-800 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-white border-stone-200/80 text-stone-900 shadow-2xs'
              }`}
            >
              {isWinner && (
                <div className="absolute right-3 top-3 opacity-15">
                  <Trophy className="w-20 h-20 text-white" />
                </div>
              )}

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : idx === 1
                          ? 'bg-stone-300 text-stone-900'
                          : 'bg-amber-700/60 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-mono font-medium ${
                        isWinner ? 'text-emerald-300' : 'text-stone-500'
                      }`}
                    >
                      {idx === 0 ? '首选推荐方案' : idx === 1 ? '次选备选方案' : '第三位方案'}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-sm font-bold ${
                      isWinner ? 'text-emerald-300' : 'text-emerald-800'
                    }`}
                  >
                    {(item.score * 100).toFixed(2)}%
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-serif font-bold truncate">{item.altName}</h3>
                  <div
                    className={`text-xs mt-1 font-mono ${
                      isWinner ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    综合得分 (Score) = <span className="font-bold">{item.score.toFixed(4)}</span>
                  </div>
                </div>

                {/* Progress mini bar */}
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      isWinner ? 'bg-amber-400' : 'bg-emerald-700'
                    }`}
                    style={{ width: `${item.score * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stacked Contributions Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900">
              各准则对各方案综合得分的贡献堆叠图（Contribution Breakdown）
            </h3>
            <p className="text-[11px] text-stone-400">
              直观查看不同维度准则在各方案最终胜出中所起到的核心拉动占比
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2">
            {model.criteria.map((c, i) => (
              <div key={c.id} className="flex items-center space-x-1 text-[11px] text-stone-600">
                <span
                  className={`w-2.5 h-2.5 rounded-sm ${
                    criteriaColors[i % criteriaColors.length]
                  }`}
                />
                <span className="truncate max-w-20">{c.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked bars for each alternative */}
        <div className="space-y-4">
          {sortedScores.map(item => (
            <div key={item.altId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                    #{item.rank}
                  </span>
                  <span className="font-semibold text-stone-800">{item.altName}</span>
                </div>
                <span className="font-mono font-bold text-emerald-900">
                  {item.score.toFixed(4)} ({(item.score * 100).toFixed(1)}%)
                </span>
              </div>

              {/* Stacked Bar */}
              <div className="w-full h-4 bg-stone-100 rounded-md overflow-hidden flex shadow-inner">
                {item.breakdown.map((b, bIdx) => {
                  const pct = (b.contribution / (item.score || 1e-6)) * 100;
                  return (
                    <div
                      key={b.criterionId}
                      className={`h-full ${
                        criteriaColors[bIdx % criteriaColors.length]
                      } transition-all duration-300 hover:brightness-110 relative group`}
                      style={{ width: `${(b.contribution / 1.0) * 100}%` }}
                      title={`${b.criterionName}: 贡献得分 ${b.contribution.toFixed(4)} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Synthesis Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-serif font-bold text-stone-900">
              层次总排序权重合成总表（Full Synthesis Matrix）
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">算法: {activeMethod}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-stone-50 border border-stone-200 text-stone-600 font-sans">
                <th className="p-2.5 text-left font-semibold">准则要素 / 备选方案</th>
                {model.criteria.map((crit, idx) => (
                  <th key={crit.id} className="p-2.5 font-semibold">
                    <span className="block truncate max-w-24 mx-auto">{crit.name}</span>
                    <span className="text-[10px] text-emerald-800 font-mono">
                      W = {criteriaWeights[idx]?.toFixed(4)}
                    </span>
                  </th>
                ))}
                <th className="p-2.5 font-semibold bg-emerald-50 text-emerald-950">
                  综合得分 (Score)
                </th>
                <th className="p-2.5 font-semibold bg-emerald-50 text-emerald-950">
                  最终名次 (Rank)
                </th>
              </tr>
            </thead>
            <tbody>
              {model.alternatives.map((alt, aIdx) => {
                const scoreObj = globalScores.find(g => g.altId === alt.id);
                return (
                  <tr
                    key={alt.id}
                    className="border border-stone-200 hover:bg-stone-50/50 text-stone-800"
                  >
                    <td className="p-2.5 text-left font-sans font-medium">
                      <span className="text-stone-400 font-mono mr-1.5">A{aIdx + 1}</span>
                      {alt.name}
                    </td>

                    {model.criteria.map((_, cIdx) => {
                      const localW = altLocalWeights[aIdx]?.[cIdx] ?? 0;
                      return (
                        <td key={cIdx} className="p-2.5 text-stone-600">
                          {localW.toFixed(4)}
                        </td>
                      );
                    })}

                    <td className="p-2.5 font-bold text-emerald-950 bg-emerald-50/40">
                      {scoreObj?.score.toFixed(4)}
                    </td>
                    <td className="p-2.5 font-bold text-emerald-950 bg-emerald-50/40 font-sans">
                      #{scoreObj?.rank}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          已形成基准方案排序。接下来可通过敏感性分析测试当某项准则权重波动时，结果是否稳健。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：动态敏感性分析</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
