import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';
import { formatScaleValue, getRI } from '../utils/ahpMath';

export const GroupAhpTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const {
    model,
    experts,
    activeExpertIndex,
    setActiveExpertIndex,
    updateExpertWeight,
    updateExpertMatrixCell,
    addExpert,
    removeExpert,
    groupAhpResult,
  } = useAhp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpName, setNewExpName] = useState('');
  const [newExpTitle, setNewExpTitle] = useState('');

  const currentExpert = experts[activeExpertIndex] || experts[0];
  const n = model.criteria.length;
  const isGroupPass = groupAhpResult.cr < 0.10;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpName.trim()) {
      addExpert(newExpName.trim(), newExpTitle.trim() || '特邀评审专家');
      setNewExpName('');
      setNewExpTitle('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              群体决策融合（Group AHP Consensus）
            </h1>
            <p className="text-xs text-stone-500">
              汇聚多位评审专家判断矩阵，依据专家声誉权重采用加权几何平均法（AIJ）合成群体判断矩阵，并度量专家分歧度。
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>引入新专家</span>
          </button>
        </div>

        {/* Sliced Expert Switcher */}
        <div className="flex items-center space-x-2 overflow-x-auto border-t border-stone-100 pt-3">
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap">专家委员会：</span>
          {experts.map((exp, idx) => {
            const isSelected = idx === activeExpertIndex;
            return (
              <button
                key={exp.id}
                onClick={() => setActiveExpertIndex(idx)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                <span>{exp.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-emerald-950/40 text-emerald-200' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {(exp.weight * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Expert Form Modal */}
      {showAddModal && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold text-stone-800">邀请新专家加入评审团</span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              关闭
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="专家姓名（如：陈院士）"
              value={newExpName}
              onChange={e => setNewExpName(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              required
            />
            <input
              type="text"
              placeholder="专家职称/头衔（如：学科带头人）"
              value={newExpTitle}
              onChange={e => setNewExpTitle(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1 rounded-lg text-xs text-stone-600 hover:bg-stone-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg text-xs bg-emerald-800 text-white font-medium shadow-2xs"
            >
              确认添加
            </button>
          </div>
        </form>
      )}

      {/* Active Expert Matrix Inspection Card */}
      {currentExpert && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono">
                {currentExpert.name.slice(0, 1)}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-stone-900">
                  {currentExpert.name} 的独立准则判断矩阵
                </h3>
                <p className="text-[11px] text-stone-500">{currentExpert.title}</p>
              </div>
            </div>

            {/* Expert weight adjustment */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500 font-medium">专家权重：</span>
              <input
                type="number"
                min="0.05"
                max="1"
                step="0.05"
                value={currentExpert.weight}
                onChange={e =>
                  updateExpertWeight(currentExpert.id, parseFloat(e.target.value) || 0.1)
                }
                className="w-18 px-2 py-1 text-xs font-mono text-center rounded border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              {experts.length > 1 && (
                <button
                  onClick={() => removeExpert(currentExpert.id)}
                  title="移除该专家"
                  className="p-1 text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Expert Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-stone-50 border border-stone-200 text-stone-600 font-sans">
                  <th className="p-2 text-left">准则</th>
                  {model.criteria.map((c, j) => (
                    <th key={c.id} className="p-2 truncate max-w-24">
                      {c.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.criteria.map((r, i) => (
                  <tr key={r.id} className="border border-stone-200">
                    <td className="p-2 text-left font-sans font-medium text-stone-800">
                      {r.name.split(' ')[0]}
                    </td>
                    {model.criteria.map((c, j) => {
                      const val = currentExpert.criteriaMatrix[i]?.[j] ?? 1;
                      const isDiag = i === j;
                      return (
                        <td
                          key={c.id}
                          className={`p-2 border border-stone-200 ${
                            isDiag ? 'bg-stone-100 text-stone-400' : 'bg-white'
                          }`}
                        >
                          {isDiag ? (
                            '1'
                          ) : (
                            <input
                              type="number"
                              min="0.11"
                              max="9"
                              step="0.1"
                              value={Number(val.toFixed(2))}
                              onChange={e =>
                                updateExpertMatrixCell(
                                  currentExpert.id,
                                  i,
                                  j,
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              className="w-14 text-center py-0.5 rounded border border-transparent hover:border-stone-300 focus:border-emerald-600 focus:outline-none"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aggregated Group Judgment Matrix & CR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: AIJ Matrix */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900">
                加权几何平均群体判断矩阵（AIJ Aggregated Matrix）
              </h3>
              <p className="text-[11px] text-stone-400">
                ã_ij = ∏ (a_ij^(k))^α_k，数学证明其严格保持正互反性质
              </p>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isGroupPass ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}
            >
              群体 CR = {groupAhpResult.cr.toFixed(4)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-stone-50 border border-stone-200 text-stone-600 font-sans">
                  <th className="p-2 text-left">准则</th>
                  {model.criteria.map((c, j) => (
                    <th key={c.id} className="p-2 truncate max-w-24">
                      {c.name.split(' ')[0]}
                    </th>
                  ))}
                  <th className="p-2 bg-emerald-50 text-emerald-950">群体合成权重</th>
                </tr>
              </thead>
              <tbody>
                {model.criteria.map((r, i) => (
                  <tr key={r.id} className="border border-stone-200">
                    <td className="p-2 text-left font-sans font-medium text-stone-800">
                      {r.name.split(' ')[0]}
                    </td>
                    {model.criteria.map((c, j) => {
                      const val = groupAhpResult.aggregatedMatrix[i]?.[j] ?? 1;
                      return (
                        <td
                          key={c.id}
                          className={`p-2 border border-stone-200 ${
                            i === j ? 'bg-stone-100 text-stone-400' : 'bg-stone-50/50'
                          }`}
                        >
                          {val.toFixed(3)}
                        </td>
                      );
                    })}
                    <td className="p-2 font-bold text-emerald-950 bg-emerald-50/40">
                      {((groupAhpResult.weights[i] || 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Disagreement Analysis */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-serif font-bold text-stone-900">
              专家意见分歧度离散排查
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">基于对数方差</span>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] text-stone-500">
              方差越大，说明专家组在此对指标权衡上存在较大分歧，建议组织聚焦研讨：
            </p>
            {groupAhpResult.expertDisagreements.slice(0, 4).map((d, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-stone-800">
                    {d.criterionI} 与 {d.criterionJ}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    均值: {d.mean.toFixed(2)} | 专家出价: [{d.values.map(v => formatScaleValue(v)).join(', ')}]
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      d.variance > 0.4
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    方差 {d.variance.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          群体决策实验完成。接下来进入核心实验链路的 Python 代码引擎，用 NumPy 代码进行严谨的算法复现。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：Python 代码引擎（Python Engine）</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
