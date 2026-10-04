import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  TrendingUp,
  Sliders,
  Layers,
  Sparkles,
  HelpCircle,
  Wrench
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';
import { diagnoseMatrix, formatScaleValue, getRI } from '../utils/ahpMath';

export const WeightCrTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const {
    model,
    activeMethod,
    setActiveMethod,
    applySuggestedFix,
  } = useAhp();

  // Choose which matrix to diagnose: 'criteria' or criterionId
  const [selectedTarget, setSelectedTarget] = useState<'criteria' | string>('criteria');

  const isCriteria = selectedTarget === 'criteria';
  const targetMatrix = isCriteria
    ? model.criteriaMatrix
    : (model.altMatrices[selectedTarget] || []);
  const targetNames = isCriteria
    ? model.criteria.map(c => c.name)
    : model.alternatives.map(a => a.name);

  // Run full diagnosis on the selected matrix
  const diag = diagnoseMatrix(targetMatrix, targetNames);

  // Results for the 3 methods
  const { eigen, geometric, arithmetic, ri, conflictPairs, transitivityViolations } = diag;
  const isConsistent = eigen.cr < 0.10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Selector */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              权重计算与一致性诊断（Weight & CR Diagnosis）
            </h1>
            <p className="text-xs text-stone-500">
              并列对比和法、方根法、特征值法三种权重解法，严密求解 λ_max、CI、CR，并深度定位矩阵矛盾与冲突对。
            </p>
          </div>

          {/* Quick Target Selector */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedTarget('criteria')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isCriteria
                  ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              准则层总矩阵
            </button>
            {model.criteria.map((crit, idx) => (
              <button
                key={crit.id}
                onClick={() => setSelectedTarget(crit.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTarget === crit.id
                    ? 'bg-teal-800 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                C{idx + 1} 方案矩阵
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Consistency Metrics Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LambdaMax */}
        <div className="bg-white p-4.5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>最大特征值 λ_max</span>
            <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">理论基准: {diag.matrixSize}</span>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900">
            {eigen.lambdaMax.toFixed(4)}
          </div>
          <p className="text-[11px] text-stone-500">
            {eigen.lambdaMax >= diag.matrixSize
              ? `偏离理论完全一致值 ${(eigen.lambdaMax - diag.matrixSize).toFixed(4)}`
              : '完美吻合'}
          </p>
        </div>

        {/* CI */}
        <div className="bg-white p-4.5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>一致性指标 (CI)</span>
            <span className="font-mono text-[10px] text-stone-400">CI = (λ - n)/(n - 1)</span>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900">
            {eigen.ci.toFixed(4)}
          </div>
          <p className="text-[11px] text-stone-500">
            基准随机指标 RI = <span className="font-mono font-semibold">{ri.toFixed(2)}</span>
          </p>
        </div>

        {/* CR */}
        <div
          className={`p-4.5 rounded-xl border shadow-2xs space-y-2 ${
            isConsistent
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">一致性比率 (CR)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/70">
              阈值 &lt; 0.10
            </span>
          </div>
          <div className="text-2xl font-mono font-bold">
            {eigen.cr.toFixed(4)}
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-medium">
            {isConsistent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>满意一致性检验通过</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>超标，需要调谐冲突项</span>
              </>
            )}
          </div>
        </div>

        {/* Active Algorithm Badge */}
        <div className="bg-white p-4.5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>当前默认合成算法</span>
            <span className="text-emerald-700 text-xs font-semibold">可切换</span>
          </div>
          <div className="text-base font-serif font-bold text-stone-900">
            {activeMethod === 'eigen' ? '特征值法 (幂迭代)' : (activeMethod === 'geometric' ? '方根法 (几何平均)' : '和法 (算术归一)')}
          </div>
          <div className="flex space-x-1 pt-0.5">
            {(['eigen', 'geometric', 'arithmetic'] as const).map(m => (
              <button
                key={m}
                onClick={() => setActiveMethod(m)}
                className={`text-[10px] px-2 py-0.5 rounded transition-all font-medium ${
                  activeMethod === m
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {m === 'eigen' ? '特征值' : (m === 'geometric' ? '方根' : '和法')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Three Methods Comparison Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-serif font-bold text-stone-900">
              三种权重计算方法同台比对（Three Methods Comparison）
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {isCriteria ? '准则层相对权重' : '当前准则下方案局部权重'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-stone-50 border border-stone-200 text-xs text-stone-600">
                <th className="p-2.5 text-left font-semibold">要素名称</th>
                <th className="p-2.5 font-semibold">
                  <span>特征值法 (Eigenvector)</span>
                  <span className="block text-[10px] text-stone-400 font-normal">Aw = λ w 幂法</span>
                </th>
                <th className="p-2.5 font-semibold">
                  <span>方根法 (Geometric)</span>
                  <span className="block text-[10px] text-stone-400 font-normal">连乘开 n 次方根</span>
                </th>
                <th className="p-2.5 font-semibold">
                  <span>和法 (Arithmetic)</span>
                  <span className="block text-[10px] text-stone-400 font-normal">列归一化行求和</span>
                </th>
                <th className="p-2.5 font-semibold">最大绝对偏差</th>
                <th className="p-2.5 font-semibold">占比权重柱形</th>
              </tr>
            </thead>
            <tbody>
              {targetNames.map((name, idx) => {
                const wE = eigen.weights[idx] || 0;
                const wG = geometric.weights[idx] || 0;
                const wA = arithmetic.weights[idx] || 0;
                const maxDev = Math.max(Math.abs(wE - wG), Math.abs(wE - wA), Math.abs(wG - wA));
                return (
                  <tr key={idx} className="border border-stone-200 hover:bg-stone-50/50 text-xs font-mono">
                    <td className="p-2.5 text-left font-sans font-medium text-stone-800">
                      <span className="text-stone-400 font-mono mr-1.5">#{idx + 1}</span>
                      {name}
                    </td>
                    <td className="p-2.5 font-bold text-emerald-950 bg-emerald-50/30">
                      {wE.toFixed(4)} ({(wE * 100).toFixed(1)}%)
                    </td>
                    <td className="p-2.5 text-stone-800">
                      {wG.toFixed(4)} ({(wG * 100).toFixed(1)}%)
                    </td>
                    <td className="p-2.5 text-stone-800">
                      {wA.toFixed(4)} ({(wA * 100).toFixed(1)}%)
                    </td>
                    <td className="p-2.5 text-stone-500">
                      ±{maxDev.toFixed(4)}
                    </td>
                    <td className="p-2.5 w-44">
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-700 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, wE * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50/80 font-mono text-xs font-bold text-stone-800 border border-stone-200">
                <td className="p-2 text-left font-sans">归一化合计 (Sum)</td>
                <td className="p-2 text-emerald-900">1.0000 (100%)</td>
                <td className="p-2">1.0000 (100%)</td>
                <td className="p-2">1.0000 (100%)</td>
                <td className="p-2 text-stone-400">-</td>
                <td className="p-2 text-stone-400">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Inconsistency Conflict Diagnosis & Suggested Fix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Deviation Conflict Pairs */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-serif font-bold text-stone-900">
                矩阵偏差点智能识别与一键微调建议
              </h3>
            </div>
            <span className="text-[10px] text-stone-400">
              基于理论值比值 w_i / w_j
            </span>
          </div>

          {conflictPairs.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                系统检测到以下单元格与全矩阵权重理论比值存在较大偏离，是导致 CR 升高的主要原因：
              </p>
              {conflictPairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-stone-800">
                      {pair.nameI} 与 {pair.nameJ}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono space-x-2">
                      <span>当前打分: {formatScaleValue(pair.currentValue)}</span>
                      <span>→</span>
                      <span className="text-emerald-800 font-bold">
                        建议标度: {formatScaleValue(pair.suggestedValue)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      applySuggestedFix(selectedTarget, pair.i, pair.j, pair.suggestedValue)
                    }
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>采纳修正</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-stone-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-semibold text-stone-800">矩阵逻辑高度协调！</p>
              <p className="text-[11px] text-stone-400">未发现超出允许阈值的显著偏离单元格。</p>
            </div>
          )}
        </div>

        {/* Transitivity Violations */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-serif font-bold text-stone-900">
                传递性矛盾与循环反转检查 (Transitivity Check)
              </h3>
            </div>
            <span className="text-[10px] text-stone-400">逻辑闭环侦测</span>
          </div>

          {transitivityViolations.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                发现打分中存在逻辑三元反转矛盾（即 A &gt; B，B &gt; C，但输入中却认为 A &lt; C）：
              </p>
              {transitivityViolations.map((tv, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-stone-800 space-y-1"
                >
                  <div className="font-semibold text-amber-900">
                    循环矛盾 #{idx + 1}
                  </div>
                  <div className="text-[11px] text-stone-600 leading-relaxed">
                    {tv.rule}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-stone-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-semibold text-stone-800">无传递性逆转违背</p>
              <p className="text-[11px] text-stone-400">
                打分在方向性偏好上保持递推一致，没有“剪刀石头布”式的循环矛盾。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          矩阵诊断完毕且 CR 满意，接下来将各层局部权重自顶向下合成方案全局得分。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：权重合成与方案总排序</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
