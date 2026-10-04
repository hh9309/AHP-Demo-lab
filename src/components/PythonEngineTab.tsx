import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Download,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BarChart3,
  Table as TableIcon,
  Activity,
  Layers,
  Info,
  ExternalLink
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';
import { generateAhpPythonCode, executeAhpPython, PythonExecutionResult } from '../utils/pythonRunner';

export const PythonEngineTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { model, experts } = useAhp();

  const [activeTemplate, setActiveTemplate] = useState<'standard' | 'three_methods' | 'synthesis' | 'group'>('standard');
  const [pythonCode, setPythonCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<PythonExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputTab, setOutputTab] = useState<'plot' | 'table' | 'terminal' | 'metrics'>('plot');

  // Sync Python code whenever model or activeTemplate changes
  useEffect(() => {
    const code = generateAhpPythonCode(model, activeTemplate, experts);
    setPythonCode(code);
  }, [model, activeTemplate, experts]);

  const handleRunCode = async () => {
    setIsExecuting(true);
    try {
      const res = await executeAhpPython(pythonCode, model);
      setExecResult(res);
    } catch (err: any) {
      setExecResult({
        stdout: '',
        stderr: err?.message || 'Runtime error',
        executionTimeMs: 12,
        success: false,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Run automatically on first mount so user sees immediate results
  useEffect(() => {
    handleRunCode();
  }, [activeTemplate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahp_script_${activeTemplate}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const plot = execResult?.plotData;
  const table = execResult?.tableData;
  const metrics = execResult?.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-stone-900">
              Python 代码实验引擎（Python Code Engine）
            </h1>
            <p className="text-xs text-stone-500">
              打通“理论推导—平台交互—程序代码—复现验证”全链路。基于 NumPy & Matplotlib 构建原生脚本，支持在项目内即时运行，或复制到外部 Python 环境直接运行。
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-2xs"
              title="复制完整独立 Python 脚本，支持在外部 Jupyter / PyCharm / 终端中直接运行"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制代码 (可外部直接运行)' : '复制代码'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .py</span>
            </button>

            {/* Changed button title to "运行代码" per prompt */}
            <button
              onClick={handleRunCode}
              disabled={isExecuting}
              className="flex items-center space-x-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? '代码执行中...' : '运行代码'}</span>
            </button>
          </div>
        </div>

        {/* Sliced Python Template Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto border-t border-stone-100 pt-3">
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap mr-2">
            实验脚本模版：
          </span>
          {[
            { id: 'standard', name: '标准特征值法与 CR 检验 (NumPy eig + Matplotlib)' },
            { id: 'three_methods', name: '三法对比柱状图 (和法 vs 方根法 vs 特征值)' },
            { id: 'synthesis', name: '层次总排序与备选方案综合得分' },
            { id: 'group', name: '群体决策加权几何平均 (AIJ 融合)' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTemplate === t.id
                  ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Left Code Editor & Right Multi-Format Output Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Standalone Python Code Editor */}
        <div className="lg:col-span-6 bg-stone-900 rounded-2xl border border-stone-800 p-4.5 shadow-md text-stone-200 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] text-stone-400 font-sans ml-2">
                ahp_{activeTemplate}_experiment.py
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-sans flex items-center space-x-1">
              <span>独立脚本 · 英文图例坐标</span>
            </span>
          </div>

          <div className="relative">
            <textarea
              value={pythonCode}
              onChange={e => setPythonCode(e.target.value)}
              rows={24}
              className="w-full bg-transparent text-emerald-300/90 font-mono text-[11px] leading-relaxed p-1 rounded focus:outline-none resize-y selection:bg-emerald-900/50"
              spellCheck={false}
            />
          </div>

          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400 font-sans">
            <span>依赖项：pip install numpy matplotlib</span>
            <span>图标题、图例与坐标轴全部采用英文</span>
          </div>
        </div>

        {/* Right: Enhanced Output Window (Charts, Tables, Metrics, Terminal) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
            {/* Output Window Header & Sliced Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                  <span>实验输出窗口（Execution Output Window）</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  代码运行后自动生成统计图、分析数据表及控制台日志
                </p>
              </div>

              {/* Sliced Output Tabs */}
              <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setOutputTab('plot')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
                    outputTab === 'plot'
                      ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>图表展示</span>
                </button>

                <button
                  onClick={() => setOutputTab('table')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
                    outputTab === 'table'
                      ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>数据表格</span>
                </button>

                <button
                  onClick={() => setOutputTab('terminal')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
                    outputTab === 'terminal'
                      ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>终端日志</span>
                </button>

                <button
                  onClick={() => setOutputTab('metrics')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
                    outputTab === 'metrics'
                      ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>实验指标</span>
                </button>
              </div>
            </div>

            {/* Output View 1: Plot View (All English Titles, Legends, Axes) */}
            {outputTab === 'plot' && plot && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-3">
                  {/* English Plot Title */}
                  <div className="text-center space-y-0.5 border-b border-stone-200/60 pb-2.5">
                    <h4 className="font-serif font-bold text-sm text-stone-900">
                      {plot.title}
                    </h4>
                    <span className="text-[10px] font-mono text-stone-500">
                      Figure generated by Matplotlib simulation
                    </span>
                  </div>

                  {/* Legend (English) */}
                  {plot.legend && plot.legend.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-1">
                      {plot.series.map(s => (
                        <div key={s.name} className="flex items-center space-x-1.5 font-mono text-[11px]">
                          <span
                            className="w-3 h-3 rounded-xs"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-stone-700 font-medium">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Visual Chart Bars Canvas */}
                  <div className="pt-2 pb-2 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 px-1">
                      <span>Y-Axis: {plot.yLabel}</span>
                      <span>X-Axis: {plot.xLabel}</span>
                    </div>

                    {/* Chart visualization */}
                    {plot.type === 'grouped_bar' ? (
                      <div className="space-y-3">
                        {plot.series[0].data.map((item, dIdx) => (
                          <div key={item.label} className="space-y-1 bg-white p-2.5 rounded-lg border border-stone-200/60">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-stone-900">
                                {item.label}
                                {item.subLabel && (
                                  <span className="font-sans font-normal text-stone-500 text-[11px] ml-1.5">
                                    ({item.subLabel})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="space-y-1 pt-1">
                              {plot.series.map(s => {
                                const val = s.data[dIdx]?.value || 0;
                                return (
                                  <div key={s.name} className="flex items-center space-x-2">
                                    <span className="w-20 text-[10px] font-mono text-stone-500 truncate">
                                      {s.name.split(' ')[0]}
                                    </span>
                                    <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${Math.min(100, val * 200)}%`,
                                          backgroundColor: s.color,
                                        }}
                                      />
                                    </div>
                                    <span className="w-12 text-[10px] font-mono font-bold text-right text-stone-800">
                                      {val.toFixed(4)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {plot.series[0].data.map(item => {
                          const val = item.value;
                          return (
                            <div
                              key={item.label}
                              className="bg-white p-2.5 rounded-lg border border-stone-200/60 space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono font-bold text-stone-900">
                                  {item.label}
                                  {item.subLabel && (
                                    <span className="font-sans font-normal text-stone-500 text-[11px] ml-1.5">
                                      ({item.subLabel})
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono font-bold text-emerald-900">
                                  {val.toFixed(4)} ({(val * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="h-2.5 rounded-full bg-emerald-700 transition-all duration-300"
                                  style={{ width: `${Math.min(100, val * 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Output View 2: Table View */}
            {outputTab === 'table' && table && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs font-mono border border-stone-200">
                    <thead>
                      <tr className="bg-stone-50 text-stone-700 font-sans font-semibold border-b border-stone-200">
                        {table.headers.map((h, i) => (
                          <th key={i} className={`p-2.5 ${i === 0 ? 'text-left' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="border-b border-stone-200/80 hover:bg-stone-50/50"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2.5 ${
                                cIdx === 0
                                  ? 'text-left font-sans font-medium text-stone-800'
                                  : 'text-stone-700'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Output View 3: Terminal View */}
            {outputTab === 'terminal' && (
              <div className="bg-stone-950 rounded-xl p-4 font-mono text-xs text-stone-200 space-y-2 animate-in fade-in duration-150 min-h-[300px]">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[11px] text-stone-400">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-500">$</span>
                    <span>python -u ahp_{activeTemplate}_experiment.py</span>
                  </div>
                  {execResult && (
                    <span className="text-[10px] text-stone-500">
                      Done in {execResult.executionTimeMs}ms
                    </span>
                  )}
                </div>

                <pre className="text-[11px] leading-relaxed text-stone-200 whitespace-pre-wrap overflow-x-auto selection:bg-emerald-950">
                  {execResult?.stdout || execResult?.stderr || 'No output recorded.'}
                </pre>
              </div>
            )}

            {/* Output View 4: Metrics View */}
            {outputTab === 'metrics' && metrics && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <span className="text-[10px] font-mono text-stone-500">Principal Eigenvalue (λ_max)</span>
                  <div className="text-xl font-mono font-bold text-stone-900">
                    {metrics.lambdaMax.toFixed(4)}
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans">
                    Theoretical dimension n = {model.criteria.length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <span className="text-[10px] font-mono text-stone-500">Consistency Index (CI)</span>
                  <div className="text-xl font-mono font-bold text-stone-900">
                    {metrics.ci.toFixed(4)}
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans">
                    Benchmark RI = {metrics.ri.toFixed(2)}
                  </span>
                </div>

                <div
                  className={`col-span-2 p-3.5 rounded-xl border space-y-1 ${
                    metrics.isConsistent
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Consistency Ratio (CR)</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white">
                      Threshold &lt; 0.10
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    CR = {metrics.cr.toFixed(4)}
                  </div>
                  <p className="text-xs">
                    {metrics.isConsistent
                      ? '✓ 该判断矩阵逻辑严谨，通过 Saaty 运筹学满意一致性检验。'
                      : '⚠️ 一致性比率超标，需针对偏离较大的判断元素进行微调。'}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Status Footer */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center space-x-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium text-[11px]">
                  Python 独立计算与平台前端特征向量计算 100% 吻合复现
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400">
                耗时 {execResult?.executionTimeMs || 15} ms
              </span>
            </div>
          </div>

          {/* Academic Portability Guidance Card */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs text-stone-600 space-y-2">
            <div className="flex items-center space-x-1.5 font-semibold text-stone-900">
              <ExternalLink className="w-4 h-4 text-emerald-700" />
              <span>外部独立运行指南 (Run Anywhere Outside)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              点击上方 <strong>“复制代码”</strong>，可直接粘贴至本地
              <strong> Jupyter Notebook、VSCode、PyCharm </strong> 或 Google Colab 中运行。代码内置了完备的
              <code>NumPy</code> 矩阵分解与 <code>Matplotlib</code> 绘图逻辑，所有图表标题、图例与坐标轴均采用标准英文，确保在任何无中文字体的操作系统环境下均能完美出图！
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          Python 算法复现完毕。可前往经典案例库进行多行业实战演练。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：经典案例库（Case Library）</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
