import React, { useState } from 'react';
import {
  Grid3X3,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Layers,
  Target,
  Info,
  Maximize2
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';
import { formatScaleValue, calcEigenvector, getRI } from '../utils/ahpMath';

export const MatrixTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const {
    model,
    updateCriteriaMatrixCell,
    updateAltMatrixCell,
    resetMatrixToIdentity,
  } = useAhp();

  // Selected matrix mode: 'criteria' or criterionId
  const [selectedTarget, setSelectedTarget] = useState<'criteria' | string>('criteria');
  
  // Selected cell for interactive slider (row i, col j)
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>({ i: 0, j: 1 });

  // Get current active matrix and names
  const isCriteria = selectedTarget === 'criteria';
  const activeMatrix = isCriteria
    ? model.criteriaMatrix
    : (model.altMatrices[selectedTarget] || []);
  const activeNames = isCriteria
    ? model.criteria.map(c => c.name)
    : model.alternatives.map(a => a.name);
  const n = activeNames.length;

  // Live consistency preview of the currently inspected matrix
  const matrixResult = calcEigenvector(activeMatrix);
  const matrixRi = getRI(n);
  const isPass = matrixResult.cr < 0.10;

  // Scale levels for interactive picker:
  // left preferred: 9, 7, 5, 3, 2
  // equal: 1
  // right preferred: 1/2, 1/3, 1/5, 1/7, 1/9
  const scaleOptions = [
    { label: '9:1', val: 9, text: '左侧绝对极端重要' },
    { label: '7:1', val: 7, text: '左侧强烈重要' },
    { label: '5:1', val: 5, text: '左侧明显重要' },
    { label: '3:1', val: 3, text: '左侧稍微重要' },
    { label: '2:1', val: 2, text: '左侧微弱优势' },
    { label: '1:1', val: 1, text: '两者同等重要' },
    { label: '1:2', val: 1/2, text: '右侧微弱优势' },
    { label: '1:3', val: 1/3, text: '右侧稍微重要' },
    { label: '1:5', val: 1/5, text: '右侧明显重要' },
    { label: '1:7', val: 1/7, text: '右侧强烈重要' },
    { label: '1:9', val: 1/9, text: '右侧绝对极端重要' },
  ];

  const handleCellClick = (i: number, j: number) => {
    if (i === j) return; // diagonal is always 1
    // Normalize so i < j
    if (i > j) {
      setSelectedCell({ i: j, j: i });
    } else {
      setSelectedCell({ i, j });
    }
  };

  const handleSetScale = (val: number) => {
    if (!selectedCell) return;
    const { i, j } = selectedCell;
    if (isCriteria) {
      updateCriteriaMatrixCell(i, j, val);
    } else {
      updateAltMatrixCell(selectedTarget, i, j, val);
    }
  };

  const currentCellValue = selectedCell
    ? (activeMatrix[selectedCell.i]?.[selectedCell.j] ?? 1)
    : 1;

  // Determine current active criterion name if viewing alternative matrix
  const currentCriterionObj = !isCriteria
    ? model.criteria.find(c => c.id === selectedTarget)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Quick Selector */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              两两比较矩阵（Pairwise Comparison Matrix）
            </h1>
            <p className="text-xs text-stone-500">
              按 Saaty 1-9 标度法交互输入判断值，系统自动保持对角线为 1 并实时同步倒数互反元素 (a_ji = 1 / a_ij)。
            </p>
          </div>

          {/* CR Status Indicator */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium border ${
                isPass
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {isPass ? (
                <CheckCircle className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <div>
                <span className="block text-[10px] text-stone-500 font-sans">
                  当前矩阵一致性 (CR)
                </span>
                <span className="font-bold">
                  CR = {matrixResult.cr.toFixed(4)}{' '}
                  {isPass ? '【合格 < 0.1】' : '【超标，需修正】'}
                </span>
              </div>
            </div>

            <button
              onClick={() => resetMatrixToIdentity(selectedTarget)}
              title="重置当前矩阵为单位同等矩阵(所有值为1)"
              className="p-2.5 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sliced Matrix Target Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-t border-stone-100 pt-3">
          <button
            onClick={() => {
              setSelectedTarget('criteria');
              setSelectedCell({ i: 0, j: 1 });
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              isCriteria
                ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>准则层总矩阵 (Goal → Criteria)</span>
          </button>

          {model.criteria.map((crit, idx) => (
            <button
              key={crit.id}
              onClick={() => {
                setSelectedTarget(crit.id);
                setSelectedCell({ i: 0, j: 1 });
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedTarget === crit.id
                  ? 'bg-teal-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>
                准则 C{idx + 1} 下方案对比 ({crit.name.split(' ')[0]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Matrix Workspace: Left Grid & Right Sliced Interactive Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Matrix Heatmap Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900">
                {isCriteria
                  ? `准则层两两比较矩阵 (${n} × ${n})`
                  : `在准则【${currentCriterionObj?.name}】下各方案的两两对比矩阵 (${n} × ${n})`}
              </h3>
              <p className="text-[11px] text-stone-400">
                点击表格中非对角线单元格可快速调谐两要素的相对重要性标度
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              对角线 a_ii = 1
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-[11px] font-semibold text-stone-500 bg-stone-50/80 border border-stone-200 rounded-tl-lg">
                    对比要素
                  </th>
                  {activeNames.map((name, idx) => (
                    <th
                      key={idx}
                      className="p-2 text-[11px] font-semibold text-stone-800 bg-stone-50/80 border border-stone-200 max-w-28 truncate"
                      title={name}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeNames.map((rowName, i) => (
                  <tr key={i}>
                    <td
                      className="p-2 text-[11px] font-medium text-stone-800 bg-stone-50/50 border border-stone-200 text-left max-w-28 truncate"
                      title={rowName}
                    >
                      <span className="font-mono text-[10px] text-stone-400 mr-1">
                        #{i + 1}
                      </span>
                      {rowName}
                    </td>

                    {activeNames.map((colName, j) => {
                      const val = activeMatrix[i]?.[j] ?? 1;
                      const isDiag = i === j;
                      const isSelected =
                        selectedCell &&
                        ((selectedCell.i === i && selectedCell.j === j) ||
                          (selectedCell.i === j && selectedCell.j === i));

                      // Heatmap color logic
                      let cellColor = 'bg-white hover:bg-stone-50 text-stone-800';
                      if (isDiag) {
                        cellColor = 'bg-stone-100/80 text-stone-400 font-mono';
                      } else if (val > 1) {
                        // Green accent for superiority
                        cellColor = 'bg-emerald-50/90 text-emerald-950 font-bold hover:bg-emerald-100';
                      } else if (val < 1) {
                        // Amber/slate accent for reciprocal
                        cellColor = 'bg-amber-50/60 text-amber-950 hover:bg-amber-100/70';
                      }

                      if (isSelected && !isDiag) {
                        cellColor += ' ring-2 ring-emerald-700 ring-inset';
                      }

                      return (
                        <td
                          key={j}
                          onClick={() => handleCellClick(i, j)}
                          className={`p-2.5 text-xs font-mono border border-stone-200 cursor-pointer transition-all ${cellColor}`}
                        >
                          {formatScaleValue(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300" />
                <span>值 &gt; 1 (优势)</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-stone-100 border border-stone-300" />
                <span>值 = 1 (同等)</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300" />
                <span>值 &lt; 1 (劣势倒数)</span>
              </span>
            </div>
            <span className="font-mono">阶数: {n} × {n}</span>
          </div>
        </div>

        {/* Right: Interactive Sliced Pairwise Evaluator */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-serif font-bold text-stone-900">
              两两交互评价切片调谐
            </h3>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
              实时互反同步
            </span>
          </div>

          {selectedCell ? (
            <div className="space-y-5">
              {/* Dual Elements Comparison Card */}
              <div className="grid grid-cols-2 gap-3 items-center bg-stone-50 p-3.5 rounded-xl border border-stone-200/70 text-center">
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    currentCellValue >= 1
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  <span className="text-[10px] font-mono text-stone-400 block">
                    要素 A (第 {selectedCell.i + 1} 项)
                  </span>
                  <span className="text-xs truncate block mt-0.5">
                    {activeNames[selectedCell.i]}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border transition-all ${
                    currentCellValue <= 1
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  <span className="text-[10px] font-mono text-stone-400 block">
                    要素 B (第 {selectedCell.j + 1} 项)
                  </span>
                  <span className="text-xs truncate block mt-0.5">
                    {activeNames[selectedCell.j]}
                  </span>
                </div>
              </div>

              {/* Current Value Visualizer */}
              <div className="text-center space-y-1">
                <span className="text-xs text-stone-500">当前赋值标度：</span>
                <div className="text-xl font-mono font-bold text-emerald-900">
                  {formatScaleValue(currentCellValue)}
                </div>
                <p className="text-[11px] text-stone-600">
                  {currentCellValue > 1
                    ? `【${activeNames[selectedCell.i]}】 相比 【${activeNames[selectedCell.j]}】 占优（标度 ${formatScaleValue(currentCellValue)}）`
                    : currentCellValue < 1
                    ? `【${activeNames[selectedCell.j]}】 相比 【${activeNames[selectedCell.i]}】 占优（标度 ${formatScaleValue(1 / currentCellValue)}）`
                    : `【${activeNames[selectedCell.i]}】 与 【${activeNames[selectedCell.j]}】 具有同等重要性`}
                </p>
              </div>

              {/* Sliced 1-9 Scale Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>← 偏好要素 A ({activeNames[selectedCell.i]?.slice(0, 4)})</span>
                  <span>同等</span>
                  <span>偏好要素 B ({activeNames[selectedCell.j]?.slice(0, 4)}) →</span>
                </div>

                <div className="grid grid-cols-11 gap-1">
                  {scaleOptions.map(opt => {
                    const isCurrent = Math.abs(currentCellValue - opt.val) < 0.05;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleSetScale(opt.val)}
                        title={opt.text}
                        className={`py-2 text-[10px] font-mono font-bold rounded transition-all text-center ${
                          isCurrent
                            ? 'bg-emerald-800 text-white shadow-xs scale-105 ring-2 ring-emerald-950/20'
                            : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                        }`}
                      >
                        {opt.label.split(':')[0] === '1' && opt.label !== '1:1'
                          ? `1/${opt.label.split(':')[1]}`
                          : opt.label.split(':')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scale interpretation box */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70 text-xs text-stone-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>调整提示：</strong>
                  若判断矩阵 CR &gt; 0.1，可通过微调两两之间的倍数关系，或前往下一步使用
                  <span className="text-emerald-800 font-semibold">“智能冲突诊断与一键建议修复”</span>
                  自动将偏差元素调整到推荐标度。
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 text-xs">
              请点击左侧矩阵中的任意非对角线单元格以开始赋值
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          已完成矩阵输入，可直接前往求解特征向量与诊断一致性指标。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：权重计算与一致性诊断</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
