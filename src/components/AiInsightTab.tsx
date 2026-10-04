import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Settings,
  Send,
  Bot,
  User,
  Key,
  Check,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Cpu,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  ExternalLink,
  Target,
  Layers,
  Award,
  Scale
} from 'lucide-react';
import { useAhp } from '../context/AhpContext';
import {
  AiConfig,
  AiModelType,
  getStoredAiConfig,
  saveStoredAiConfig,
  callAiDecisionAssistant
} from '../services/aiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiInsightTab: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { model, synthesisResult, criteriaDiagnosis } = useAhp();

  // AI Configuration state
  const [config, setConfig] = useState<AiConfig>(getStoredAiConfig);
  const [selectedModel, setSelectedModel] = useState<AiModelType>(config.selectedModel);
  const [geminiKeyInput, setGeminiKeyInput] = useState(config.geminiApiKey);
  const [deepseekKeyInput, setDeepseekKeyInput] = useState(config.deepseekApiKey);
  const [customEndpoint, setCustomEndpoint] = useState(config.customEndpoint || '');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是您的 **AHP 决策洞察智能顾问**。
我已自动同步并深入感知您当前正在构建的决策模型：
* **当前决策总目标**：${model.goal}
* **准则层要素**：${model.criteria.length} 项 | **候选方案**：${model.alternatives.length} 项
* **首选方案推荐**：${synthesisResult.globalScores[0]?.altName || '计算中'} (综合得分: ${((synthesisResult.globalScores[0]?.score || 0) * 100).toFixed(1)}%)
* **全层次一致性指标**：CR = ${synthesisResult.hierarchyCr.toFixed(4)} (${synthesisResult.isHierarchyConsistent ? '通过检验' : '超标需调优'})

您可以点击右上角 **⚙️ 齿轮图标** 手工输入 API-Key 并选择大模型（**gemini 3 flash** 或 **deepseek-v4-pro**），然后向我咨询决策矛盾调优、权重专业解读或抗风险稳定性分析。`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Save "确认大模型"
  const handleConfirmModelSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newConfig: AiConfig = {
      selectedModel,
      geminiApiKey: geminiKeyInput.trim(),
      deepseekApiKey: deepseekKeyInput.trim(),
      customEndpoint: customEndpoint.trim(),
    };
    saveStoredAiConfig(newConfig);
    setConfig(newConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettingsModal(false);
    }, 1200);
  };

  const currentActiveKey =
    config.selectedModel === 'gemini-3-flash' ? config.geminiApiKey : config.deepseekApiKey;
  const isKeyConfigured = Boolean(currentActiveKey && currentActiveKey.trim().length > 0);

  // Quick preset questions
  const quickPrompts = [
    '💡 深度诊断当前判断矩阵一致性矛盾与调优建议',
    '🏆 解读首选优胜方案的核心竞优优势与潜在短板',
    '📊 分析若改变第一大准则权重，方案排名是否稳健？',
    '📝 为本项决策撰写一份精炼的管理层汇报结论陈述',
  ];

  const handleSendMessage = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    if (!isKeyConfigured) {
      setShowSettingsModal(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const responseText = await callAiDecisionAssistant({
        userQuestion: q,
        config,
        model,
        synthesis: synthesisResult,
        diagnosis: criteriaDiagnosis,
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **调用出现异常**：${err?.message || '网络连接或 API Key 校验失败，请检查设置。'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        role: 'assistant',
        content: '对话记录已清空。您可以继续围绕当前 AHP 决策模型提出任何分析需求。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-800" />
              <h1 className="text-xl font-serif font-bold text-stone-900">
                AI 决策洞察（AI Decision Insights）
              </h1>
            </div>
            <p className="text-xs text-stone-500">
              接入 Google Gemini 与 DeepSeek 顶级大模型，全面感知当前判断矩阵与方案排序，提供专业级决策归因、矛盾调优与汇报总结。
            </p>
          </div>

          {/* Model Status & Settings Trigger Button */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-mono text-stone-700 font-semibold">
                {config.selectedModel === 'gemini-3-flash' ? 'gemini 3 flash' : 'deepseek-v4-pro'}
              </span>
              <span className="text-stone-300">|</span>
              <span className={`text-[11px] font-medium ${isKeyConfigured ? 'text-emerald-700' : 'text-amber-600'}`}>
                {isKeyConfigured ? 'API-Key 已就绪' : '待配置 Key'}
              </span>
            </div>

            {/* Gear Setting Icon */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 shadow-2xs transition-all"
              title="设置大模型与 API-Key"
            >
              <Settings className="w-4 h-4 text-emerald-800" />
              <span>模型设置</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Left Chat Dialogue & Right Live Context & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Chat Dialogue Box */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col h-[680px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-serif font-bold text-stone-900">
                  运筹学决策智能顾问对话框
                </h3>
                <p className="text-[10px] text-stone-400">
                  基于浏览器端直接调用 · 严格受控 API-Key 安全执行
                </p>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>清空记录</span>
            </button>
          </div>

          {/* Not Configured Warning Banner */}
          {!isKeyConfigured && (
            <div className="bg-amber-50 p-3 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>尚未手工配置 API-Key，需先设置才能调用大模型回答问题</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-2xs"
              >
                立即配置
              </button>
            </div>
          )}

          {/* Messages Flow */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#fafafa]">
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isUser ? 'bg-stone-800 text-white' : 'bg-emerald-800 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] p-4 rounded-2xl space-y-1.5 shadow-2xs ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-tr-xs'
                        : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px] font-sans">
                      {msg.content}
                    </div>
                    <div
                      className={`text-[10px] text-right font-mono ${
                        isUser ? 'text-stone-400' : 'text-stone-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-xs border border-stone-200 shadow-2xs text-xs text-stone-600 flex items-center space-x-2.5">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {config.selectedModel === 'gemini-3-flash' ? 'Gemini 3 Flash' : 'DeepSeek-V4-Pro'} 正在深度剖析当前决策数据...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Questions */}
          <div className="px-4 py-2 bg-stone-100/70 border-t border-stone-200/60 overflow-x-auto flex space-x-2 scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600 hover:text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/50 whitespace-nowrap transition-all shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-stone-200/80 space-y-2">
            <div className="flex items-center space-x-2">
              <textarea
                rows={2}
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isKeyConfigured
                    ? '向大模型提问：如“分析当前判断矩阵的一致性矛盾”或“评估首选方案短板”...'
                    : '请先在右上角【模型设置】中配置 API-Key 后方可发起对话...'
                }
                disabled={!isKeyConfigured || isLoading}
                className="flex-1 p-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white resize-none disabled:opacity-60"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!isKeyConfigured || !inputQuestion.trim() || isLoading}
                className="p-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="发送问题"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
              <span>Enter 发送，Shift+Enter 换行</span>
              <span>纯前端直连 · 支持 GitHub 静态部署</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Live Context Card & Model Settings Box */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Decision Context Card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Target className="w-4 h-4 text-emerald-800" />
              <h3 className="text-xs font-serif font-bold text-stone-900">
                实时决策感知上下文（Live Context）
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">当前决策总目标</span>
                <span className="font-semibold text-stone-900 font-serif">{model.goal}</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <span className="text-[10px] text-emerald-900 font-mono block font-semibold">
                  ★ 当前综合首选方案
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-stone-900">
                    {synthesisResult.globalScores[0]?.altName}
                  </span>
                  <span className="font-mono font-bold text-emerald-900">
                    {((synthesisResult.globalScores[0]?.score || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">一致性检验比率 (CR)</span>
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-stone-900">
                    CR = {criteriaDiagnosis.eigen.cr.toFixed(4)}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    criteriaDiagnosis.eigen.isConsistent ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {criteriaDiagnosis.eigen.isConsistent ? '满意一致' : '超标'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Model Configuration Box */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-emerald-800" />
                <h3 className="text-xs font-serif font-bold text-stone-900">
                  大模型配置切片
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {config.selectedModel}
              </span>
            </div>

            <form onSubmit={handleConfirmModelSettings} className="space-y-4 text-xs">
              {/* 1. Model Selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800 block">
                  1. 选择大模型：
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3-flash')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedModel === 'gemini-3-flash'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-700/10 text-emerald-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="font-mono text-xs block">gemini 3 flash</span>
                    <span className="text-[10px] text-stone-500 font-normal">Google 模型</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('deepseek-v4-pro')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedModel === 'deepseek-v4-pro'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-700/10 text-teal-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="font-mono text-xs block">deepseek-v4-pro</span>
                    <span className="text-[10px] text-stone-500 font-normal">DeepSeek 运筹</span>
                  </button>
                </div>
              </div>

              {/* 2. API Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800 flex items-center space-x-1">
                    <Key className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. 手工输入 API-Key：</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {selectedModel === 'gemini-3-flash' ? (
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    placeholder="AIzaSy... (Gemini API-Key)"
                    value={geminiKeyInput}
                    onChange={e => setGeminiKeyInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                  />
                ) : (
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    placeholder="sk-... (DeepSeek API-Key)"
                    value={deepseekKeyInput}
                    onChange={e => setDeepseekKeyInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                )}
              </div>

              {/* 3. Confirm Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>已确认并保存大模型！</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>确认大模型（保存配置）</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <span className="text-xs text-stone-500">
          已完成 AI 决策深度洞察。下一步可前往数据与报告中心，沉淀并导出规范化的全套决策报告与实验数据。
        </span>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group"
        >
          <span>下一步：数据与报告中心（Data & Reports）</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Modal Settings Backdrop (if opened from header) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-serif font-bold text-stone-900">
                  大模型参数与 API-Key 设置
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmModelSettings} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800 block">
                  1. 选择大模型 (gemini 3 flash / deepseek-v4-pro)：
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3-flash')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedModel === 'gemini-3-flash'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-700/10 text-emerald-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="font-mono text-xs block">gemini 3 flash</span>
                    <span className="text-[10px] text-stone-500 font-normal">Google 多模态</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('deepseek-v4-pro')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedModel === 'deepseek-v4-pro'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-700/10 text-teal-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="font-mono text-xs block">deepseek-v4-pro</span>
                    <span className="text-[10px] text-stone-500 font-normal">DeepSeek 运筹</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800 flex items-center space-x-1">
                    <Key className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. 手工输入 API-Key：</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {selectedModel === 'gemini-3-flash' ? (
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    placeholder="AIzaSy... (手工输入 Gemini API-Key)"
                    value={geminiKeyInput}
                    onChange={e => setGeminiKeyInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type={showKeySecret ? 'text' : 'password'}
                      placeholder="sk-... (手工输入 DeepSeek API-Key)"
                      value={deepseekKeyInput}
                      onChange={e => setDeepseekKeyInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                      required
                    />
                    <input
                      type="text"
                      placeholder="自定义接口地址 (选填，默认 https://api.deepseek.com/chat/completions)"
                      value={customEndpoint}
                      onChange={e => setCustomEndpoint(e.target.value)}
                      className="w-full px-3 py-1.5 text-[11px] font-mono rounded-lg border border-stone-200 bg-white text-stone-600"
                    />
                  </div>
                )}
                <p className="text-[10px] text-stone-400 pt-1">
                  注意：Key 仅保存在浏览器本地 localStorage 中，由前端直接调用，完全支持 GitHub Pages 静态部署。
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>已确认并保存配置！</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>确认大模型（保存配置）</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
