import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';

export const SensitivityTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { model, synthesisResult } = useAhp();
  const { criteriaWeights: baseCriteriaWeights, altLocalWeights } = synthesisResult;

  // Selected criterion to modulate (index)
  const [selectedCritIdx, setSelectedCritIdx] = useState<number>(0);
  
  // Modulated weight of the selected criterion (0 to 1)
  const [modWeight, setModWeight] = useState<number>(() => baseCriteriaWeights[0] || 0.2);

  // When selected criterion changes, initialize modWeight with its base weight
  const handleSelectCrit = (idx: number) => {
    setSelectedCritIdx(idx);
    setModWeight(baseCriteriaWeights[idx] || 0.2);
  };

  // Re-calculate dynamically normalized criteria weights
  const { simulatedCriteriaWeights, simulatedScores, baseWinnerId, simulatedWinnerId, crossoverThreshold } =
    useMemo(() => {
      const nCrits = model.criteria.length;
      const nAlts = model.alternatives.length;
      const baseWk = baseCriteriaWeights[selectedCritIdx] || (1 / nCrits);
      const remainingBaseSum = 1 - baseWk;

      // New criteria weights vector
      const simWeights = new Array(nCrits).fill(0);
      simWeights[selectedCritIdx] = modWeight;

      const remainingNewSum = 1 - modWeight;
      for (let j = 0; j < nCrits; j++) {
        if (j !== selectedCritIdx) {
          simWeights[j] =
            remainingBaseSum > 1e-6
              ? (baseCriteriaWeights[j] / remainingBaseSum) * remainingNewSum
              : remainingNewSum / (nCrits - 1);
        }
      }

      // Compute simulated scores for alternatives
      const scores = model.alternatives.map((alt, aIdx) => {
        let score = 0;
        for (let j = 0; j < nCrits; j++) {
          score += (simWeights[j] || 0) * (altLocalWeights[aIdx]?.[j] || 0);
        }
        return {
          altId: alt.id,
          altName: alt.name,
          score: Number(score.toFixed(4)),
        };
      });

      // Sort
      const sorted = [...scores].sort((a, b) => b.score - a.score);
      const rankedScores = scores.map(item => {
        const rank = sorted.findIndex(s => s.altId === item.altId) + 1;
        return { ...item, rank };
      });

      // Find base winner vs simulated winner
      const baseSorted = [...synthesisResult.globalScores].sort((a, b) => b.score - a.score);
      const baseWinId = baseSorted[0]?.altId;
      const simWinId = sorted[0]?.altId;

      // Find crossover points by sweeping w_k from 0 to 1 in 100 steps
      let crossover: { weight: number; oldWinner: string; newWinner: string } | null = null;
      let prevWinner = '';
      for (let step = 0; step <= 100; step++) {
        const testWk = step / 100;
        const testRemaining = 1 - testWk;
        let bestS = -1;
        let curWin = '';

        for (let a = 0; a < nAlts; a++) {
          let s = 0;
          for (let j = 0; j < nCrits; j++) {
            const wj =
              j === selectedCritIdx
                ? testWk
                : remainingBaseSum > 1e-6
                ? (baseCriteriaWeights[j] / remainingBaseSum) * testRemaining
                : testRemaining / (nCrits - 1);
            s += wj * (altLocalWeights[a]?.[j] || 0);
          }
          if (s > bestS) {
            bestS = s;
            curWin = model.alternatives[a]?.name || '';
          }
        }

        if (step === 0) {
          prevWinner = curWin;
        } else if (curWin !== prevWinner && !crossover) {
          crossover = {
            weight: testWk,
            oldWinner: prevWinner,
            newWinner: curWin,
          };
          break;
        }
      }

      return {
        simulatedCriteriaWeights: simWeights,
        simulatedScores: rankedScores,
        baseWinnerId: baseWinId,
        simulatedWinnerId: simWinId,
        crossoverThreshold: crossover,
      };
    }, [model, baseCriteriaWeights, altLocalWeights, selectedCritIdx, modWeight, synthesisResult]);

  const selectedCritObj = model.criteria[selectedCritIdx] || model.criteria[0];
  const baseWeightVal = baseCriteriaWeights[selectedCritIdx] || 0.2;
  const isWinnerChanged = baseWinnerId !== simulatedWinnerId;

  // Preset scenarios
  const handleResetToBaseline = () => {
    setModWeight(baseWeightVal);
  };

  const handleSetHighWeight = () => {
    setModWeight(0.60);
  };

  const handleSetLowWeight = () => {
    setModWeight(0.05);
  };

  const handleSetEqualWeights = () => {
    const n = model.criteria.length;
    setModWeight(Number((1 / n).toFixed(3)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              动态敏感性分析（Dynamic Sensitivity Lab）
            </h1>
            <p className="text-xs text-stone-500">
              通过扰动单一准则权重，观察其余准则自动等比归一化后的方案综合得分走势与名次翻转临界点。
            </p>
          </div>

          {/* Quick preset scenario buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={handleResetToBaseline}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>基准恢复 ({baseWeightVal.toFixed(2)})</span>
            </button>
            <button
              onClick={handleSetHighWeight}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            >
              极端侧重 (60%)
            </button>
            <button
              onClick={handleSetLowWeight}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              极度削弱 (5%)
            </button>
            <button
              onClick={handleSetEqualWeights}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              均等分布
            </button>
          </div>
        </div>

        {/* Sliced Criteria Selector */}
        <div className="flex items-center space-x-1 overflow-x-auto border-t border-stone-100 pt-3">
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap mr-2">
            选择扰动准则：
          </span>
          {model.criteria.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => handleSelectCrit(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCritIdx === idx
                  ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              C{idx + 1} {c.name.split(' ')[0]} ({(baseCriteriaWeights[idx] * 100).toFixed(0)}%)
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Modulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dynamic Slider & Current State */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900">
                准则【{selectedCritObj.name}】权重滑块调谐
              </h3>
              <p className="text-[11px] text-stone-400">
                拖动滑块从 0% 到 100% 动态观察对各方案排名的即时冲击
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              {(modWeight * 100).toFixed(1)}%
            </span>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>0% (完全忽略)</span>
              <span className="font-mono text-emerald-900 font-semibold">
                基准值: {(baseWeightVal * 100).toFixed(1)}%
              </span>
              <span>100% (唯一决定要素)</span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={modWeight}
              onChange={e => setModWeight(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
            />
          </div>

          {/* Re-proportioned Criteria Weights List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-800 block">
              协同等比归一化后的准则层权重分布 (Σ = 1.00)：
            </span>
            <div className="space-y-1.5">
              {model.criteria.map((c, idx) => {
                const w = simulatedCriteriaWeights[idx] || 0;
                const isTarget = idx === selectedCritIdx;
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span
                      className={`truncate max-w-36 ${
                        isTarget ? 'font-bold text-emerald-900' : 'text-stone-600'
                      }`}
                    >
                      {c.name} {isTarget && '★'}
                    </span>
                    <div className="flex items-center space-x-2 flex-1 max-w-xs ml-3">
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-150 ${
                            isTarget ? 'bg-emerald-700' : 'bg-stone-400'
                          }`}
                          style={{ width: `${w * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] w-12 text-right">
                        {(w * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crossover Alert Pill */}
          {crossoverThreshold && (
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">排名翻转临界阈值检测：</span>
                <p className="text-[11px] leading-relaxed">
                  当准则【{selectedCritObj.name.split(' ')[0]}】权重调整至{' '}
                  <strong className="font-mono text-amber-900">
                    {(crossoverThreshold.weight * 100).toFixed(0)}%
                  </strong>{' '}
                  附近时，最优方案将从【{crossoverThreshold.oldWinner}】翻转为【
                  {crossoverThreshold.newWinner}】！
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-time Scores & Ranking Changes */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-serif font-bold text-stone-900">
              各方案得分与名次动态响应
            </h3>
            {isWinnerChanged ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                ⚠️ 首选方案已发生翻转
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono">
                ✓ 决策稳定性良好
              </span>
            )}
          </div>

          {/* Animated Alternative Score Bars */}
          <div className="space-y-4">
            {simulatedScores
              .slice()
              .sort((a, b) => b.score - a.score)
              .map(alt => {
                const isWinner = alt.rank === 1;
                return (
                  <div
                    key={alt.altId}
                    className={`p-3.5 rounded-xl border transition-all duration-200 ${
                      isWinner
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500/10'
                        : 'bg-stone-50/50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isWinner
                              ? 'bg-emerald-700 text-white'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          #{alt.rank}
                        </span>
                        <span className="font-semibold text-stone-800">{alt.altName}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-950">
                        {alt.score.toFixed(4)} ({(alt.score * 100).toFixed(1)}%)
                      </span>
                    </div>

                    <div className="w-full bg-stone-200/70 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-200 ${
                          isWinner ? 'bg-emerald-700' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, alt.score * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Academic Sensitivity Interpretation */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/70 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-stone-900 font-semibold">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>决策鲁棒性（Robustness）学术评注</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              若在准则权重发生大幅上下浮动时，排名第1的方案始终保持领先，说明该决策具备优异的
              <strong>“结构抗扰性”</strong>；反之，若在微小扰动下就发生冠军易主，则应组织更深度的专家研讨或开展群体 AHP 综合打分。
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          敏感性分析完成。接下来可进入群体决策，汇聚多位专家的打分矩阵并以几何平均法合成。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：群体决策融合（Group AHP）</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
