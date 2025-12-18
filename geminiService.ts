
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    const sanitizedKey = (config.openRouterKey || "").replace(/[^\x00-\x7F]/g, "").trim();
    
    // 尝试 OpenRouter 路径
    if (sanitizedKey !== "") {
      try {
        const sanitizedOrigin = window.location.origin.replace(/[^\x00-\x7F]/g, "");
        const sanitizedBaseUrl = (config.apiBaseUrl || "https://openrouter.ai/api/v1")
          .trim()
          .replace(/[^\x00-\x7F]/g, "")
          .replace(/\/$/, "");

        const response = await fetch(`${sanitizedBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sanitizedKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": sanitizedOrigin,
            "X-Title": "JingXin Guardian System" 
          },
          body: JSON.stringify({
            model: config.preferredModel || "google/gemini-2.0-flash-001",
            messages: [
              ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
              { role: "user", content: prompt }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          return data.choices?.[0]?.message?.content || "AI 响应内容为空";
        } else {
          // 如果 OpenRouter 报错 (例如 User not found)，记录警告并触发回退
          console.warn("OpenRouter API 报错，准备切换至原生 SDK:", data.error?.message);
          if (!process.env.API_KEY) {
             throw new Error(data.error?.message || "OpenRouter 密钥异常且无备用 SDK 密钥");
          }
        }
      } catch (err: any) {
        console.warn("OpenRouter 访问受限，正在尝试 Native Gemini SDK 回退...");
        if (!process.env.API_KEY) {
          return `[系统报警] AI 链路异常且未配置备用密钥: ${err.message}`;
        }
      }
    }

    // 回退方案：原生 Gemini SDK (必须存在 process.env.API_KEY)
    try {
      if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // 确保模型名称兼容 Native SDK (去掉 OpenRouter 的前缀)
        let nativeModel = config.preferredModel || 'gemini-3-flash-preview';
        if (nativeModel.includes('/')) {
          nativeModel = nativeModel.split('/').pop() || 'gemini-3-flash-preview';
        }
        // 如果是特殊的 exp 模型或 flash 模型，确保名称规范
        if (!nativeModel.startsWith('gemini-')) {
          nativeModel = 'gemini-3-flash-preview';
        }

        const response = await ai.models.generateContent({
          model: nativeModel,
          contents: prompt,
          config: systemInstruction ? { systemInstruction, temperature: 0.7 } : { temperature: 0.7 }
        });
        return response.text || "Gemini SDK 响应内容为空";
      }
      return `[配置缺失] 无法连接 AI。OpenRouter Key 可能无效，且系统未在环境变量中配置 process.env.API_KEY。`;
    } catch (err: any) {
      console.error("Native SDK Final Fallback Error:", err);
      return `[核心链路故障] 您的 API Key 可能已超额或不可用。请在“系统设置”中尝试更换为有效的 OpenRouter Key。`;
    }
  },

  async analyzeExamReport(content: string, config: SystemConfig, history?: string) {
    const prompt = `【生理研判指令】\n分析以下体检数据，评估其高压勤务适岗度。\n当前数据：${content}\n历史参考：${history || '无'}`;
    return this.callAI(prompt, config, "你是一名警务职业健康专家。");
  },

  async getPsychTestResponse(messages: { role: 'user' | 'model'; text: string }[], officerInfo: any, round: number, config: SystemConfig) {
    const systemInstruction = `你是警务心理咨询师。这是第 ${round} 轮对话。当前对象：${officerInfo?.name || '匿名民警'}。请以战友语气交流。第10轮输出评估报告。`;
    const lastMessage = messages[messages.length - 1].text;
    return this.callAI(lastMessage, config, systemInstruction);
  },

  async generateComprehensiveReport(data: { officer: any, exams: any[], psychs: any[], talks: any[] }, config: SystemConfig) {
    const context = `
    民警姓名: ${data.officer?.name}
    警号: ${data.officer?.policeId}
    部门: ${data.officer?.department}
    体检摘要: ${JSON.stringify(data.exams.map(e => e.analysis))}
    心理对话摘要: ${JSON.stringify(data.psychs.map(p => p.content))}
    历史谈话记录: ${JSON.stringify(data.talks)}
    `;
    return this.callAI(context, config, REPORT_GENERATION_PROMPT);
  }
};
