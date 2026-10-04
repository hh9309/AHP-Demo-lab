import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, HelpCircle, CheckCircle2, ChevronRight, Hash, Divide, Lightbulb } from 'lucide-react';
import { AHP_WIKI_DATA } from '../data/wikiContent';
import { RI_TABLE } from '../utils/ahpMath';

export const WikiTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(AHP_WIKI_DATA[0].id);
  const [selectedScale, setSelectedScale] = useState<number>(3);
  const [query, setQuery] = useState('');

  const currentSection = AHP_WIKI_DATA.find(s => s.id === selectedSectionId) || AHP_WIKI_DATA[0];

  const filteredSections = AHP_WIKI_DATA.filter(
    s => s.title.includes(query) || s.summary.includes(query) || s.tag.includes(query)
  );

  const scaleDescriptions: Record<number, { title: string; meaning: string; reciprocal: string; example: string }> = {
    1: {
      title: '同等重要 (Equal Importance)',
      meaning: '两个要素相比，对目标的贡献与达成重要性完全等同',
      reciprocal: '倒数仍为 1 (1/1)',
      example: '选车时：外观颜值与车机UI对于买方而言具有无差别的同等偏好',
    },
    2: {
      title: '略微重要偏向 (Slight to Moderate)',
      meaning: '介于同等重要与明显重要之间的折中判断标度',
      reciprocal: '倒数为 1/2 (0.50)',
      example: '稍微倾向于某一指标，但未形成决定性差距',
    },
    3: {
      title: '稍微重要 / 略微优势 (Moderate Importance)',
      meaning: '经验与主观判断表明，某一要素比另一要素略微受到偏爱',
      reciprocal: '倒数为 1/3 (0.333)',
      example: '选购家用车时，整车安全性比后备箱容积略微重要',
    },
    4: {
      title: '明显重要偏向 (Moderate to Strong)',
      meaning: '介于稍微重要与明显重要之间的过渡标度',
      reciprocal: '倒数为 1/4 (0.25)',
      example: '产品质量相比包装美观度有较为明确的重视程度',
    },
    5: {
      title: '明显重要 / 显著优势 (Strong Importance)',
      meaning: '有明确经验或数据证明，某一要素比另一要素显著重要得多',
      reciprocal: '倒数为 1/5 (0.20)',
      example: '供应商评选中：合格品率比企业官网精致度明显重要',
    },
    6: {
      title: '强烈重要偏向 (Strong to Very Strong)',
      meaning: '介于显著重要与强烈重要之间的过渡标度',
      reciprocal: '倒数为 1/6 (0.167)',
      example: '在高端制造业中，关键零部件精度比普通交期更为偏向',
    },
    7: {
      title: '强烈重要 / 高度优势 (Very Strong / Demonstrated)',
      meaning: '某一要素具有压倒性优势并在实际实践中得到充分显现',
      reciprocal: '倒数为 1/7 (0.143)',
      example: '科研项目立项：重大原始创新性相比申报书排版强烈重要',
    },
    8: {
      title: '极端重要偏向 (Very Strong to Extreme)',
      meaning: '介于强烈重要与绝对重要之间的极端临界标度',
      reciprocal: '倒数为 1/8 (0.125)',
      example: '生死攸关的安全性指标对比非关键附加功能',
    },
    9: {
      title: '极端重要 / 绝对优势 (Extreme Importance)',
      meaning: '两个要素相比，某一要素的重要程度达到最高级别的断崖式压倒性',
      reciprocal: '倒数为 1/9 (0.111)',
      example: '航天飞船发动机密封可靠性对比座舱内饰氛围灯颜色',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Slice */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium border border-emerald-400/20">
            <span>AHP WIKI 知识导引与运筹理论</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
            层次分析法（Analytic Hierarchy Process）理论体系
          </h1>
          <p className="text-stone-300 text-sm leading-relaxed font-sans">
            由美国运筹学家托马斯·萨蒂（Thomas L. Saaty）创建。通过将多元决策问题结构化为
            <span className="text-emerald-300 font-medium">“目标—准则—方案”</span>
            层次，运用两两判断矩阵与代数特征向量分析，有效消解人类主观评价的模糊性，并以严格的数学逻辑检验一致性。
          </p>
        </div>
      </div>

      {/* Main Sliced Content: Left navigation & Right interactive encyclopedia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Topics directory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="搜索理论概念、标度、公式..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              {filteredSections.map((sec, idx) => {
                const isSelected = sec.id === selectedSectionId;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start justify-between group ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/90 shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-emerald-200/70 text-emerald-900 font-bold' : 'bg-stone-100 text-stone-500'}`}>
                          0{idx + 1}
                        </span>
                        <span className="font-medium text-stone-800 group-hover:text-stone-900">{sec.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1 pl-6">{sec.summary}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 mt-1 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-stone-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick RI Random Index Table Card */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-semibold text-stone-800">Saaty 平均随机一致性指标 (RI 表)</h3>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">1~12阶标准值</span>
            </div>
            <p className="text-[11px] text-stone-500">
              通过千次正互反随机矩阵模拟求得，阶数 n ≤ 2 时天然完全一致 (RI = 0)。
            </p>
            <div className="grid grid-cols-6 gap-1.5 text-center font-mono text-[11px]">
              {Object.entries(RI_TABLE)
                .slice(0, 12)
                .map(([n, ri]) => (
                  <div key={n} className="bg-stone-50 p-1.5 rounded border border-stone-200/60">
                    <span className="block text-[10px] text-stone-400 font-sans">n={n}</span>
                    <span className="font-semibold text-emerald-900">{ri.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Section & Interactive Scale Explorer */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Article Card */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 font-medium">
                  {currentSection.tag}
                </span>
                <h2 className="text-xl font-serif font-bold text-stone-900 mt-2">{currentSection.title}</h2>
              </div>
            </div>

            <div className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed text-stone-700 whitespace-pre-line space-y-4">
              {currentSection.content}
            </div>

            {currentSection.mathFormula && (
              <div className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-4 font-mono text-center text-xs sm:text-sm text-stone-800 overflow-x-auto shadow-inner">
                <span className="text-stone-400 block text-[11px] font-sans mb-1">【核心数学解析式】</span>
                <span className="text-emerald-900 font-semibold">{currentSection.mathFormula}</span>
              </div>
            )}

            {currentSection.keyPoints && (
              <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>核心要义与实验启示</span>
                </div>
                <ul className="space-y-1 text-xs text-stone-700">
                  {currentSection.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Interactive 1-9 Scale Sandbox */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Divide className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-serif font-bold text-stone-900">交互式 1—9 标度探索沙盘</h3>
              </div>
              <span className="text-xs text-stone-400">点击不同标度查看心理学定义与倒数映射</span>
            </div>

            {/* Sliced Scale Buttons */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedScale(num)}
                  className={`flex-1 min-w-10 py-2 rounded-lg text-xs font-mono font-bold transition-all text-center ${
                    selectedScale === num
                      ? 'bg-emerald-800 text-white shadow-xs scale-105'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Scale detail slice */}
            {scaleDescriptions[selectedScale] && (
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-stone-900 text-xs sm:text-sm">
                    标度 {selectedScale} ：{scaleDescriptions[selectedScale].title}
                  </h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-900 font-medium">
                    {scaleDescriptions[selectedScale].reciprocal}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  <strong className="text-stone-800">定义阐释：</strong>
                  {scaleDescriptions[selectedScale].meaning}
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-stone-200/60 text-xs text-stone-700 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-stone-900">实战情景示例：</span>
                    {scaleDescriptions[selectedScale].example}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Step Callout */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onNext}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
            >
              <span>前往第 2 步：构建层次结构模型</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
