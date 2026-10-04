import React from 'react';
import {
  BookOpen,
  Network,
  Grid3X3,
  Scale,
  Award,
  SlidersHorizontal,
  Users,
  Terminal,
  Library,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';

export type TabType =
  | 'wiki'
  | 'hierarchy'
  | 'matrix'
  | 'weight_cr'
  | 'synthesis'
  | 'sensitivity'
  | 'group'
  | 'python'
  | 'cases'
  | 'ai_insight'
  | 'report';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const TABS: Array<{ id: TabType; name: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'wiki', name: '知识导引', icon: BookOpen },
  { id: 'hierarchy', name: '层次建模', icon: Network },
  { id: 'matrix', name: '两两矩阵', icon: Grid3X3 },
  { id: 'weight_cr', name: '权重诊断', icon: Scale },
  { id: 'synthesis', name: '总排序合成', icon: Award },
  { id: 'sensitivity', name: '敏感性分析', icon: SlidersHorizontal },
  { id: 'group', name: '群体决策', icon: Users },
  { id: 'python', name: 'Python代码', icon: Terminal },
  { id: 'cases', name: '经典案例', icon: Library },
  { id: 'ai_insight', name: 'AI洞察', icon: Sparkles },
  { id: 'report', name: '数据报告', icon: FileSpreadsheet },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { model, activeMethod, setActiveMethod, resetToDefault } = useAhp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-950/10">
            <span className="font-serif font-bold text-lg tracking-tight">λ</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-stone-900 text-lg tracking-tight">AHP Lab</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                决策与仿真科研版
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans truncate max-w-xs sm:max-w-md">
              当前决策：<span className="text-stone-800 font-medium">{model.goal}</span>
            </p>
          </div>
        </div>

        {/* Right Tools: Algorithm selector & Quick actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200/80 text-xs">
            <span className="text-stone-500 px-2 font-medium">算法：</span>
            {(['eigen', 'geometric', 'arithmetic'] as const).map(method => (
              <button
                key={method}
                onClick={() => setActiveMethod(method)}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  activeMethod === method
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {method === 'eigen' ? '特征值法 (标准)' : (method === 'geometric' ? '方根法' : '和法')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('cases')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">切换案例</span>
          </button>

          <button
            onClick={resetToDefault}
            title="重置当前实验数据为基准"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sliced Workflow Tabs (No Step Numbers) */}
      <div className="bg-stone-50/90 border-t border-stone-200/70 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1.5 py-1.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-white text-emerald-900 font-semibold shadow-xs border border-stone-200 ring-1 ring-emerald-800/10'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
                <span>{tab.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-700 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
