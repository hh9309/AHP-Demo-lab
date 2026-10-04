import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Settings,
  X,
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
  Minimize2,
  Maximize2
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

export const AiInsightDrawer: React.FC = () => {
  const { model, synthesisResult, criteriaDiagnosis } = useAhp();

  // Floating open/close state
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // AI Configuration state
  const [config, setConfig] = useState<AiConfig>(getStoredAiConfig);
  const [selectedModel, setSelectedModel] = useState<AiModelType>(config.selectedModel);
  const [geminiKeyInput, setGeminiKeyInput] = useState(config.geminiApiKey);
  const [deepseekKeyInput, setDeepseekKeyInput] = useState(config.deepseekApiKey);
  const [customEndpoint, setCustomEndpoint] = useState(config.customEndpoint || '');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是您的 **AHP 决策洞察智能顾问**。
我已自动同步您当前正在构建的决策模型：
* **当前决策目标**：${model.goal}
* **准则数量**：${model.criteria.length} 项 | **候选方案**：${model.alternatives.length} 项
* **首选方案推荐**：${synthesisResult.globalScores[0]?.altName || '计算中'} (${((synthesisResult.globalScores[0]?.score || 0) * 100).toFixed(1)}%)

您可以点击上方 **⚙️ 齿轮图标** 输入您的 API Key 并选择大模型（**gemini 3 flash** 或 **deepseek-v4-pro**），随后向我咨询一致性优化、权重解释或决策方案壁垒分析。`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (isOpen && !showSettings) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showSettings]);

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
      setShowSettings(false);
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
      setShowSettings(true);
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
        content: `⚠️ **调用出现异常**：${err?.message || '网络连接或 API Key 校验失败，请检查后重试。'}`,
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
    <>
      {/* 1. Floating Slice Trigger Button (Pinned on Screen) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2.5 px-4.5 py-3 rounded-full bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ring-2 ring-white/80 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            </div>
            <span className="font-serif font-bold text-xs tracking-wide">
              AI 洞察
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/15 text-emerald-200">
              {config.selectedModel === 'gemini-3-flash' ? 'Gemini' : 'DeepSeek'}
            </span>
          </button>
        </div>
      )}

      {/* 2. Floating AI Insight Card / Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[460px] h-[640px] max-h-[85vh] bg-white rounded-3xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-stone-900/10">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-teal-950 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-serif font-bold text-stone-100">
                    AI 决策洞察与专家咨询
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/20">
                    {config.selectedModel === 'gemini-3-flash' ? 'gemini 3 flash' : 'deepseek-v4-pro'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 truncate max-w-64">
                  模型感知：{model.goal}
                </p>
              </div>
            </div>

            {/* Actions: Gear Settings & Close */}
            <div className="flex items-center space-x-1">
              {/* 小齿轮设置大模型图标 */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="设置大模型与 API-Key"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                title="最小化"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-view: Settings View (Triggered by Gear Icon) */}
          {showSettings ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-stone-50/50">
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                <div className="flex items-center space-x-2 text-xs font-serif font-bold text-stone-900">
                  <Settings className="w-4 h-4 text-emerald-700" />
                  <span>大模型参数与 API-Key 设置</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  返回对话
                </button>
              </div>

              <form onSubmit={handleConfirmModelSettings} className="space-y-4 text-xs">
                {/* 1. 选择大模型 (gemini 3 flash 和 deepseek-v4-pro) */}
                <div className="space-y-2">
                  <label className="font-semibold text-stone-800 block">
                    1. 选择大模型 (Select Model)：
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
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs">gemini 3 flash</span>
                        {selectedModel === 'gemini-3-flash' && (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 font-sans font-normal">
                        Google 旗舰级多模态高速推理模型
                      </p>
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
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs">deepseek-v4-pro</span>
                        {selectedModel === 'deepseek-v4-pro' && (
                          <Check className="w-3.5 h-3.5 text-teal-700" />
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 font-sans font-normal">
                        DeepSeek 深度逻辑与运筹推理模型
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. 手工输入 API-Key */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-stone-200/80">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-stone-800 flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        2. 手工输入 API-Key ({selectedModel === 'gemini-3-flash' ? 'Gemini' : 'DeepSeek'})：
                      </span>
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
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                      required
                    />
                  ) : (
                    <div className="space-y-2">
                      <input
                        type={showKeySecret ? 'text' : 'password'}
                        placeholder="sk-... (手工输入 DeepSeek API-Key)"
                        value={deepseekKeyInput}
                        onChange={e => setDeepseekKeyInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="自定义接口地址 (选填，默认 https://api.deepseek.com/chat/completions)"
                        value={customEndpoint}
                        onChange={e => setCustomEndpoint(e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-mono rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white text-stone-600"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                    <span>仅保存在浏览器本地 localStorage，直接前端调用</span>
                    <span className="text-emerald-700 font-medium">支持 GitHub 静态部署</span>
                  </div>
                </div>

                {/* 3. 确认大模型 Button */}
                <div className="pt-2">
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
                </div>
              </form>

              {/* Security & Deployment Notice */}
              <div className="p-3 bg-stone-100/70 rounded-xl border border-stone-200/70 text-[11px] text-stone-600 space-y-1">
                <span className="font-semibold text-stone-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>GitHub 部署调用原则：</span>
                </span>
                <p className="leading-relaxed">
                  本项目完全支持打包为静态站点部署于 GitHub Pages / Vercel。所有大模型推理均由用户浏览器纯客户端发起，
                  <strong>所有大模型调用必须在输入 API-Key 后才能调用</strong>，不经过任何第三方中转，安全纯净。
                </p>
              </div>
            </div>
          ) : (
            /* Sub-view: Chat Conversation Window */
            <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
              {/* API Key Not Configured Alert Banner */}
              {!isKeyConfigured && (
                <div className="bg-amber-50 p-3 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>尚未配置 API-Key，需先设置才能调用大模型</span>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] shrink-0"
                  >
                    去配置
                  </button>
                </div>
              )}

              {/* Chat Messages Flow */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {messages.map(msg => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2 ${
                        isUser ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isUser
                            ? 'bg-stone-800 text-white'
                            : 'bg-emerald-800 text-white'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-[85%] p-3 rounded-2xl space-y-1 ${
                          isUser
                            ? 'bg-stone-900 text-white rounded-tr-xs'
                            : 'bg-white text-stone-800 border border-stone-200/90 shadow-2xs rounded-tl-xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed text-[11.5px] font-sans">
                          {msg.content}
                        </div>
                        <div
                          className={`text-[9px] text-right font-mono ${
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
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-xs border border-stone-200/90 shadow-2xs text-xs text-stone-500 flex items-center space-x-2">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>
                        {config.selectedModel === 'gemini-3-flash' ? 'Gemini 3 Flash' : 'DeepSeek-V4-Pro'} 正在深度研判当前决策矩阵...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions Prompt Chips */}
              <div className="px-3 py-1.5 bg-stone-100/70 border-t border-stone-200/60 overflow-x-auto flex space-x-1.5 scrollbar-none shrink-0">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[10.5px] text-stone-600 hover:text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/50 whitespace-nowrap transition-all shadow-2xs"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-stone-200/80 shrink-0 space-y-1.5">
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
                        ? '向大模型提问：如“分析当前判断矩阵的一致性矛盾”或“解释各准则权重影响”...'
                        : '请先在右上角齿轮设置中配置 API-Key 后方可提问...'
                    }
                    disabled={!isKeyConfigured || isLoading}
                    className="flex-1 p-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white resize-none disabled:opacity-60"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!isKeyConfigured || !inputQuestion.trim() || isLoading}
                    className="p-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="发送问题"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
                  <span>Enter 发送，Shift+Enter 换行</span>
                  <button
                    onClick={handleClearHistory}
                    className="text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    清空对话
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
