import { HierarchyModel, SynthesisResult, WeightDiagnosisResult } from '../types/ahp';

export type AiModelType = 'gemini-3-flash' | 'deepseek-v4-pro';

export interface AiConfig {
  selectedModel: AiModelType;
  geminiApiKey: string;
  deepseekApiKey: string;
  customEndpoint?: string;
}

const STORAGE_KEY = 'ahp_ai_config';

export function getStoredAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedModel: parsed.selectedModel || 'gemini-3-flash',
        geminiApiKey: parsed.geminiApiKey || '',
        deepseekApiKey: parsed.deepseekApiKey || '',
        customEndpoint: parsed.customEndpoint || '',
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    selectedModel: 'gemini-3-flash',
    geminiApiKey: '',
    deepseekApiKey: '',
    customEndpoint: '',
  };
}

export function saveStoredAiConfig(config: AiConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    // ignore
  }
}

export interface CallAiParams {
  userQuestion: string;
  config: AiConfig;
  model: HierarchyModel;
  synthesis: SynthesisResult;
  diagnosis: WeightDiagnosisResult;
}

// Build professional AHP domain context for LLM prompt
function buildAhpSystemContext(
  model: HierarchyModel,
  synthesis: SynthesisResult,
  diagnosis: WeightDiagnosisResult
): string {
  const criteriaList = model.criteria.map((c, i) => `${c.name} (权重: ${(synthesis.criteriaWeights[i] * 100).toFixed(1)}%)`).join('、');
  const sortedAlts = [...synthesis.globalScores].sort((a, b) => b.score - a.score);
  const rankingList = sortedAlts.map(a => `第${a.rank}名: ${a.altName} (综合得分: ${(a.score * 100).toFixed(1)}%)`).join('； ');

  return `你是一位国际顶尖的运筹学决策分析专家与首席战略科学家，精通托马斯·萨蒂(Thomas L. Saaty)的层次分析法(AHP)。
用户当前正在操作 AHP 实验平台，以下是当前系统的实时决策数据上下文：

【决策总目标】：${model.goal}
【背景说明】：${model.description || '无'}
【评价准则维度及权重】：${criteriaList}
【备选方案及综合排名】：${rankingList}
【准则层矩阵一致性指标】：
- 最大特征值 λ_max = ${diagnosis.eigen.lambdaMax.toFixed(4)}
- 一致性指标 CI = ${diagnosis.eigen.ci.toFixed(4)}
- 随机一致性 RI = ${diagnosis.ri.toFixed(2)}
- 一致性比率 CR = ${diagnosis.eigen.cr.toFixed(4)} (${diagnosis.eigen.isConsistent ? '满足满意一致性检验 CR < 0.10' : '超标！存在主观逻辑矛盾，需微调'})
- 全层次总一致性 CR_total = ${synthesis.hierarchyCr.toFixed(4)} (${synthesis.isHierarchyConsistent ? '全层次协调' : '全层次偏离'})

【偏离最大冲突对提示】：
${diagnosis.conflictPairs.length > 0 ? diagnosis.conflictPairs.map(p => `• ${p.nameI} 与 ${p.nameJ} 当前打分 ${p.currentValue}，理论推荐标度 ${p.suggestedValue}`).join('\n') : '暂无显著冲突'}

请基于上述真实决策数据，运用运筹学、微观经济学和管理系统工程的专业视角，深入、严谨、客观地回答用户的提问。输出格式清晰规范，支持 Markdown 排版（加粗、列表、分项标题）。`;
}

// Call AI directly from browser with user's manually entered API-Key
export async function callAiDecisionAssistant({
  userQuestion,
  config,
  model,
  synthesis,
  diagnosis,
}: CallAiParams): Promise<string> {
  const { selectedModel, geminiApiKey, deepseekApiKey, customEndpoint } = config;
  const systemPrompt = buildAhpSystemContext(model, synthesis, diagnosis);

  if (selectedModel === 'gemini-3-flash') {
    const key = geminiApiKey.trim();
    if (!key) {
      throw new Error('未检测到 Gemini API Key。请点击右上角小齿轮图标，手工输入您的 API-Key 并确认保存后再调用。');
    }

    // Call Google Gemini API directly from browser
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userQuestion }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Gemini API 调用失败 (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg += `: ${errJson.error.message}`;
        }
      } catch (e) {
        errorMsg += `: ${errText.slice(0, 100)}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('大模型未返回有效内容，请检查输入或稍后重试。');
    }
    return text;
  } else if (selectedModel === 'deepseek-v4-pro') {
    const key = deepseekApiKey.trim();
    if (!key) {
      throw new Error('未检测到 DeepSeek API Key。请点击右上角小齿轮图标，手工输入您的 API-Key 并确认保存后再调用。');
    }

    const endpoint = customEndpoint?.trim() || 'https://api.deepseek.com/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion },
        ],
        temperature: 0.4,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `DeepSeek API 调用失败 (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg += `: ${errJson.error.message}`;
        }
      } catch (e) {
        errorMsg += `: ${errText.slice(0, 100)}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('大模型未返回有效内容，请检查输入或稍后重试。');
    }
    return text;
  }

  throw new Error('未知的模型类型');
}
