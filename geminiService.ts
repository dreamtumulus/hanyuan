
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    // 强制清理配置中的非法字符
    const sanitizedKey = (config.openRouterKey || "").replace(/[^\x00-\x7F]/g, "").trim();
    
    // 如果配置了有效的 OpenRouter Key（不论是默认的还是用户填写的）
    if (sanitizedKey !== "" && sanitizedKey !== "sk-or-v1-") {
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
        if (!response.ok) {
           // 如果是 OpenRouter 报错，记录详细信息并尝试回退
           console.error("OpenRouter API Error:", data.error);
           throw new Error(data.error?.message || `HTTP ${response.status}`);
        }
        return data.choices?.[0]?.message?.content || "AI 响应内容为空";
      } catch (err: any) {
        console.warn("OpenRouter 链路异常，尝试回退到 Native SDK:", err.message);
        // 如果 OpenRouter 失败（比如 Key 过期或 User not found），这里不再直接返回错误，而是尝试回退
      }
    }

    // 回退方案：使用原生的 Gemini SDK (需要 Vercel 注入 process.env.API_KEY 或使用系统默认 Key 作为基础)
    try {
      // 这里的 process.env.API_KEY 是 Vercel 环境中配置的
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // 如果没有原生 SDK 的 Key，则只能报错
      if (!process.env.API_KEY) {
        return `[系统提示] 默认 API 密钥可能已失效 (${sanitizedKey.substring(0, 10)}...)。请管理员在“系统设置”中更新有效的 OpenRouter API Key。`;
      }

      const fallbackModel = (config.preferredModel && !config.preferredModel.includes('/')) ? config.preferredModel : 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
        config: systemInstruction ? { systemInstruction, temperature: 0.7 } : { temperature: 0.7 }
      });
      return response.text || "Gemini SDK 响应内容为空";
    } catch (err: any) {
      console.error("SDK Fallback Error:", err);
      return `[核心链路故障] 无法连接到 AI 服务。当前使用的 Key 可能已停用或额度用尽。请联系管理员更换全局配置。`;
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
