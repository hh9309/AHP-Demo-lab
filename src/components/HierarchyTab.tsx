import React, { useState, useRef, useEffect } from 'react';
import {
  Network,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Target,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle,
  GitBranch,
  Eye,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';

export const HierarchyTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const {
    model,
    setGoal,
    addCriterion,
    removeCriterion,
    updateCriterion,
    addAlternative,
    removeAlternative,
    updateAlternative,
    synthesisResult,
  } = useAhp();

  // Local state for editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState(model.goal);

  // New criterion form
  const [newCritName, setNewCritName] = useState('');
  const [newCritDesc, setNewCritDesc] = useState('');
  const [showAddCrit, setShowAddCrit] = useState(false);

  // Editing criterion
  const [editingCritId, setEditingCritId] = useState<string | null>(null);
  const [editCritName, setEditCritName] = useState('');
  const [editCritDesc, setEditCritDesc] = useState('');

  // New alternative form
  const [newAltName, setNewAltName] = useState('');
  const [newAltDesc, setNewAltDesc] = useState('');
  const [showAddAlt, setShowAddAlt] = useState(false);

  // Editing alternative
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [editAltName, setEditAltName] = useState('');
  const [editAltDesc, setEditAltDesc] = useState('');

  // State for Final Hierarchy Diagram Module
  const [diagramView, setDiagramView] = useState<'network' | 'tree'>('network');
  const [hoveredCritId, setHoveredCritId] = useState<string | null>(null);
  const [hoveredAltId, setHoveredAltId] = useState<string | null>(null);

  const numCrits = model.criteria.length;
  const numAlts = model.alternatives.length;

  // Total comparisons needed: m*(m-1)/2 + m * [n*(n-1)/2]
  const critComparisons = (numCrits * (numCrits - 1)) / 2;
  const altComparisons = numCrits * ((numAlts * (numAlts - 1)) / 2);
  const totalComparisons = critComparisons + altComparisons;

  const handleSaveGoal = () => {
    if (goalText.trim()) {
      setGoal(goalText.trim());
      setEditingGoal(false);
    }
  };

  const handleAddCrit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCritName.trim()) {
      addCriterion(newCritName.trim(), newCritDesc.trim());
      setNewCritName('');
      setNewCritDesc('');
      setShowAddCrit(false);
    }
  };

  const handleSaveEditCrit = (id: string) => {
    if (editCritName.trim()) {
      updateCriterion(id, editCritName.trim(), editCritDesc.trim());
      setEditingCritId(null);
    }
  };

  const handleAddAlt = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAltName.trim()) {
      addAlternative(newAltName.trim(), newAltDesc.trim());
      setNewAltName('');
      setNewAltDesc('');
      setShowAddAlt(false);
    }
  };

  const handleSaveEditAlt = (id: string) => {
    if (editAltName.trim()) {
      updateAlternative(id, editAltName.trim(), editAltDesc.trim());
      setEditingAltId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner without step number */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-serif font-bold text-stone-900">
            层次结构建模器（Hierarchy Builder）
          </h1>
          <p className="text-xs text-stone-500">
            自顶向下建立“目标层 (Goal) → 准则层 (Criteria) → 方案层 (Alternatives)”递阶拓扑，支持自由增删与实时参数校验。
          </p>
        </div>

        {/* Complexity Summary Pill */}
        <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 text-xs">
          <div className="text-center px-2">
            <span className="block text-[10px] text-stone-400">准则层要素</span>
            <span className="font-mono font-bold text-emerald-900">{numCrits} 个</span>
          </div>
          <div className="h-6 w-px bg-stone-200" />
          <div className="text-center px-2">
            <span className="block text-[10px] text-stone-400">备选方案</span>
            <span className="font-mono font-bold text-emerald-900">{numAlts} 个</span>
          </div>
          <div className="h-6 w-px bg-stone-200" />
          <div className="text-center px-2">
            <span className="block text-[10px] text-stone-400">两两对比总数</span>
            <span className="font-mono font-bold text-stone-700">{totalComparisons} 次</span>
          </div>
        </div>
      </div>

      {/* Visual Hierarchy Diagram / Interactive Tree Canvas */}
      <div className="space-y-6">
        {/* Layer 1: Goal Level */}
        <div className="relative">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-teal-950 rounded-2xl p-5 text-white shadow-sm border border-stone-700/50 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      最高层 · 决策总目标 (Goal Level)
                    </span>
                    {editingGoal ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="text"
                          value={goalText}
                          onChange={e => setGoalText(e.target.value)}
                          className="bg-stone-800 border border-stone-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 w-80"
                        />
                        <button
                          onClick={handleSaveGoal}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setGoalText(model.goal);
                            setEditingGoal(false);
                          }}
                          className="p-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h2 className="text-base sm:text-lg font-serif font-bold text-stone-100">
                        {model.goal}
                      </h2>
                    )}
                  </div>
                </div>

                {!editingGoal && (
                  <button
                    onClick={() => {
                      setGoalText(model.goal);
                      setEditingGoal(true);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors text-xs flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">编辑目标</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex justify-center my-3">
            <div className="w-0.5 h-6 bg-stone-300 relative">
              <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-emerald-700 ring-4 ring-white" />
            </div>
          </div>
        </div>

        {/* Layer 2: Criteria Level */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-800" />
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-900">
                  中间层 · 评价准则层 (Criteria Level)
                </h3>
                <p className="text-[11px] text-stone-500">
                  衡量总目标达成情况的各个维度要素，目前共 {numCrits} 个评估准则
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddCrit(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加准则要素</span>
            </button>
          </div>

          {/* Add Criterion Modal Form */}
          {showAddCrit && (
            <form
              onSubmit={handleAddCrit}
              className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">新增评价准则</span>
                <button
                  type="button"
                  onClick={() => setShowAddCrit(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="准则名称（如：技术成熟度）"
                  value={newCritName}
                  onChange={e => setNewCritName(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  required
                />
                <input
                  type="text"
                  placeholder="准则描述与内涵释义（选填）"
                  value={newCritDesc}
                  onChange={e => setNewCritDesc(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCrit(false)}
                  className="px-3 py-1 rounded-lg text-xs text-stone-600 hover:bg-stone-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg text-xs bg-emerald-800 hover:bg-emerald-900 text-white font-medium shadow-2xs"
                >
                  保存并加入矩阵
                </button>
              </div>
            </form>
          )}

          {/* Criteria Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {model.criteria.map((crit, idx) => {
              const isEditing = editingCritId === crit.id;
              return (
                <div
                  key={crit.id}
                  className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-all space-y-2 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 font-bold">
                        C{idx + 1}
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCritName}
                          onChange={e => setEditCritName(e.target.value)}
                          className="px-2 py-0.5 text-xs font-semibold rounded border border-emerald-400 bg-white w-32"
                        />
                      ) : (
                        <h4 className="font-semibold text-xs text-stone-800 truncate">{crit.name}</h4>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEditCrit(crit.id)}
                            className="p-1 rounded bg-emerald-700 text-white hover:bg-emerald-800"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingCritId(null)}
                            className="p-1 rounded bg-stone-200 text-stone-700 hover:bg-stone-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingCritId(crit.id);
                              setEditCritName(crit.name);
                              setEditCritDesc(crit.description || '');
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700"
                            title="编辑准则"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeCriterion(crit.id)}
                            className="p-1 text-stone-400 hover:text-red-600"
                            title="删除准则"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editCritDesc}
                      onChange={e => setEditCritDesc(e.target.value)}
                      placeholder="准则具体描述"
                      className="w-full px-2 py-1 text-[11px] rounded border border-stone-200 bg-white"
                    />
                  ) : (
                    <p className="text-[11px] text-stone-500 line-clamp-2">
                      {crit.description || '暂无描述信息'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Connector Line */}
        <div className="flex justify-center my-3">
          <div className="w-0.5 h-6 bg-stone-300 relative">
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-teal-700 ring-4 ring-white" />
          </div>
        </div>

        {/* Layer 3: Alternative Level */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-teal-800" />
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-900">
                  最底层 · 备选方案层 (Alternatives Level)
                </h3>
                <p className="text-[11px] text-stone-500">
                  参与最终综合竞优与排序的决策对象方案，目前共 {numAlts} 个方案
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddAlt(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200/80 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加备选方案</span>
            </button>
          </div>

          {/* Add Alternative Modal Form */}
          {showAddAlt && (
            <form
              onSubmit={handleAddAlt}
              className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">新增候选方案</span>
                <button
                  type="button"
                  onClick={() => setShowAddAlt(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="方案名称（如：方案D·分布式方案）"
                  value={newAltName}
                  onChange={e => setNewAltName(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  required
                />
                <input
                  type="text"
                  placeholder="方案关键特性与优势说明（选填）"
                  value={newAltDesc}
                  onChange={e => setNewAltDesc(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAlt(false)}
                  className="px-3 py-1 rounded-lg text-xs text-stone-600 hover:bg-stone-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg text-xs bg-teal-800 hover:bg-teal-900 text-white font-medium shadow-2xs"
                >
                  保存并同步方案
                </button>
              </div>
            </form>
          )}

          {/* Alternatives Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {model.alternatives.map((alt, idx) => {
              const isEditing = editingAltId === alt.id;
              return (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-all space-y-2 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 font-bold">
                        A{idx + 1}
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editAltName}
                          onChange={e => setEditAltName(e.target.value)}
                          className="px-2 py-0.5 text-xs font-semibold rounded border border-teal-400 bg-white w-32"
                        />
                      ) : (
                        <h4 className="font-semibold text-xs text-stone-800 truncate">{alt.name}</h4>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEditAlt(alt.id)}
                            className="p-1 rounded bg-teal-700 text-white hover:bg-teal-800"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingAltId(null)}
                            className="p-1 rounded bg-stone-200 text-stone-700 hover:bg-stone-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingAltId(alt.id);
                              setEditAltName(alt.name);
                              setEditAltDesc(alt.description || '');
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700"
                            title="编辑方案"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeAlternative(alt.id)}
                            className="p-1 text-stone-400 hover:text-red-600"
                            title="删除方案"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editAltDesc}
                      onChange={e => setEditAltDesc(e.target.value)}
                      placeholder="方案具体描述"
                      className="w-full px-2 py-1 text-[11px] rounded border border-stone-200 bg-white"
                    />
                  ) : (
                    <p className="text-[11px] text-stone-500 line-clamp-2">
                      {alt.description || '暂无描述信息'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* NEW MODULE: 最终模型层次结构图 (Final Model Hierarchical Structure Diagram) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-emerald-800" />
              <h3 className="text-base font-serif font-bold text-stone-900">
                最终模型层次结构图（Model Hierarchy Architecture）
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
                全拓扑互联网络
              </span>
            </div>
            <p className="text-xs text-stone-500">
              形式化呈现“总目标 (Goal) → 准则维度 (Criteria) → 候选方案 (Alternatives)”三级递阶从属拓扑与完整赋权路径。
            </p>
          </div>

          {/* Sliced View Switcher */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setDiagramView('network')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all font-medium ${
                diagramView === 'network'
                  ? 'bg-white text-emerald-950 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>拓扑全景图</span>
            </button>
            <button
              onClick={() => setDiagramView('tree')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all font-medium ${
                diagramView === 'tree'
                  ? 'bg-white text-emerald-950 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>树状分支图</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Topological Network Graph */}
        {diagramView === 'network' && (
          <div className="bg-stone-50/60 p-6 rounded-2xl border border-stone-200/70 space-y-6 overflow-x-auto">
            {/* Level 1: Goal Level */}
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>最高层 · 决策总目标 (Goal Level)</span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-teal-950 text-white shadow-md border border-stone-700/60 text-center max-w-md">
                <span className="text-xs font-serif font-bold text-stone-100 block">
                  {model.goal}
                </span>
                <span className="text-[10px] text-emerald-300 font-mono mt-0.5 block">
                  Target: 综合最优决策排序
                </span>
              </div>

              {/* Connecting Trunk to Criteria */}
              <div className="w-px h-6 bg-stone-300 my-1" />
              <div className="w-36 h-px bg-stone-300 relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-700" />
              </div>
              <div className="w-px h-4 bg-stone-300" />
            </div>

            {/* Level 2: Criteria Level */}
            <div className="space-y-2">
              <div className="text-center text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-center space-x-1">
                <Layers className="w-3 h-3" />
                <span>中间层 · 综合评价准则维度 (Criteria Level · {numCrits}项)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
                {model.criteria.map((crit, idx) => {
                  const isHovered = hoveredCritId === crit.id;
                  const weightVal = synthesisResult.criteriaWeights[idx] || 0;
                  return (
                    <div
                      key={crit.id}
                      onMouseEnter={() => setHoveredCritId(crit.id)}
                      onMouseLeave={() => setHoveredCritId(null)}
                      className={`p-3 rounded-xl border transition-all text-center cursor-pointer relative ${
                        isHovered
                          ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs scale-102'
                          : 'bg-white border-stone-200/80 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100/70 text-emerald-900">
                          C{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-900">
                          {(weightVal * 100).toFixed(1)}%
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-stone-900 truncate">
                        {crit.name}
                      </h4>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">
                        {crit.description || '评价维度'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Central Branch Lines connecting Criteria to Alternatives */}
              <div className="flex justify-center items-center py-2">
                <div className="flex items-center space-x-1 text-[10px] text-stone-400 font-mono">
                  <span>↓ 相互独立赋权分支 ({numCrits} × {numAlts} = {numCrits * numAlts} 路径) ↓</span>
                </div>
              </div>
            </div>

            {/* Level 3: Alternatives Level */}
            <div className="space-y-2">
              <div className="text-center text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 flex items-center justify-center space-x-1">
                <Target className="w-3 h-3" />
                <span>最底层 · 候选备选方案集合 (Alternatives Level · {numAlts}项)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {model.alternatives.map((alt, idx) => {
                  const isHovered = hoveredAltId === alt.id;
                  const scoreObj = synthesisResult.globalScores.find(g => g.altId === alt.id);
                  return (
                    <div
                      key={alt.id}
                      onMouseEnter={() => setHoveredAltId(alt.id)}
                      onMouseLeave={() => setHoveredAltId(null)}
                      className={`p-3.5 rounded-xl border transition-all text-center cursor-pointer ${
                        isHovered
                          ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-500/20 shadow-xs scale-102'
                          : 'bg-white border-stone-200/80 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-900">
                          A{idx + 1}
                        </span>
                        {scoreObj && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800">
                            得分 {(scoreObj.score * 100).toFixed(1)}% (第{scoreObj.rank}名)
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-stone-900 truncate">
                        {alt.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {alt.description || '候选决策方案'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Indented Hierarchical Tree */}
        {diagramView === 'tree' && (
          <div className="bg-stone-50/70 p-5 rounded-xl border border-stone-200 font-mono text-xs text-stone-800 space-y-3">
            <div className="flex items-center space-x-2 font-bold text-emerald-950 border-b border-stone-200 pb-2">
              <span className="text-sm">🎯 决策总目标 (Goal):</span>
              <span className="font-sans text-stone-900 text-xs">{model.goal}</span>
            </div>

            <div className="pl-4 space-y-4">
              {model.criteria.map((crit, cIdx) => {
                const cWeight = synthesisResult.criteriaWeights[cIdx] || 0;
                return (
                  <div key={crit.id} className="space-y-1.5">
                    <div className="flex items-center space-x-2 font-semibold text-emerald-900">
                      <span>├── [准则 C{cIdx + 1}]</span>
                      <span className="font-sans text-stone-800">{crit.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        权重: {(cWeight * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="pl-8 space-y-1 text-stone-600">
                      {model.alternatives.map((alt, aIdx) => {
                        const localW = synthesisResult.altLocalWeights[aIdx]?.[cIdx] ?? 0;
                        const isLast = aIdx === model.alternatives.length - 1;
                        return (
                          <div key={alt.id} className="flex items-center space-x-2 text-[11px]">
                            <span className="text-stone-400">{isLast ? '└──' : '├──'} [方案 A{aIdx + 1}]</span>
                            <span className="font-sans text-stone-700">{alt.name}</span>
                            <span className="text-[10px] text-stone-400">
                              (局部相对权重 p_{aIdx + 1}{cIdx + 1} = {localW.toFixed(4)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Structural Model Specifications Summary Bar */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div>
            <span className="block text-[10px] text-stone-400 font-mono">模型递阶深度</span>
            <span className="font-bold text-stone-800">3 层系统拓扑</span>
          </div>
          <div>
            <span className="block text-[10px] text-stone-400 font-mono">准则要素维度</span>
            <span className="font-bold text-emerald-900">{numCrits} 项准则</span>
          </div>
          <div>
            <span className="block text-[10px] text-stone-400 font-mono">备选决策方案</span>
            <span className="font-bold text-teal-900">{numAlts} 项方案</span>
          </div>
          <div>
            <span className="block text-[10px] text-stone-400 font-mono">正互反判断矩阵</span>
            <span className="font-bold text-stone-800">{1 + numCrits} 个矩阵</span>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Info className="w-4 h-4 text-emerald-700" />
          <span>层次结构构建完成，下一步开始输入各层要素的两两比较判断矩阵。</span>
        </div>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：输入两两比较矩阵</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
