import React, { useState } from 'react';
import { AhpProvider } from './context/AhpContext';
import { Navbar, TabType } from './components/Navbar';
import { WikiTab } from './components/WikiTab';
import { HierarchyTab } from './components/HierarchyTab';
import { MatrixTab } from './components/MatrixTab';
import { WeightCrTab } from './components/WeightCrTab';
import { SynthesisTab } from './components/SynthesisTab';
import { SensitivityTab } from './components/SensitivityTab';
import { GroupAhpTab } from './components/GroupAhpTab';
import { PythonEngineTab } from './components/PythonEngineTab';
import { CaseLibraryTab } from './components/CaseLibraryTab';
import { AiInsightTab } from './components/AiInsightTab';
import { ReportTab } from './components/ReportTab';
import { AiInsightDrawer } from './components/AiInsightDrawer';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('wiki');

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-stone-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* Top Navbar with segmented slices */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab View Canvas */}
      <main className="flex-1 pb-16">
        {activeTab === 'wiki' && <WikiTab onNext={() => setActiveTab('hierarchy')} />}
        {activeTab === 'hierarchy' && <HierarchyTab onNext={() => setActiveTab('matrix')} />}
        {activeTab === 'matrix' && <MatrixTab onNext={() => setActiveTab('weight_cr')} />}
        {activeTab === 'weight_cr' && <WeightCrTab onNext={() => setActiveTab('synthesis')} />}
        {activeTab === 'synthesis' && <SynthesisTab onNext={() => setActiveTab('sensitivity')} />}
        {activeTab === 'sensitivity' && <SensitivityTab onNext={() => setActiveTab('group')} />}
        {activeTab === 'group' && <GroupAhpTab onNext={() => setActiveTab('python')} />}
        {activeTab === 'python' && <PythonEngineTab onNext={() => setActiveTab('cases')} />}
        {activeTab === 'cases' && <CaseLibraryTab onNext={() => setActiveTab('ai_insight')} />}
        {activeTab === 'ai_insight' && <AiInsightTab onNext={() => setActiveTab('report')} />}
        {activeTab === 'report' && <ReportTab />}
      </main>

      {/* Global Floating Slice: AI 洞察 with Gear Settings and Model Q&A */}
      <AiInsightDrawer />

      {/* Scholarly Footer */}
      <footer className="border-t border-stone-200/80 bg-white/80 py-6 text-xs text-stone-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-stone-900">AHP Lab</span>
            <span>· 层次分析法交互决策与仿真实验平台</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>1-9 标度法体系</span>
            <span>•</span>
            <span>Perron-Frobenius 特征值分解</span>
            <span>•</span>
            <span>Python NumPy 闭环验证</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AhpProvider>
      <AppContent />
    </AhpProvider>
  );
}
