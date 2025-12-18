
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    // 强制清理配置中的非法字符
    const sanitizedKey = (config.openRouterKey || "").replace(/[^\x00-\x7F]/g, "").trim();
    
    // 如果配置了有效的 OpenRouter Key
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
        
        if (!response.ok) {
           console.error("OpenRouter API 错误响应:", data);
           // 特殊错误处理：User not found 通常意味着 Key 无效或额度不足
           if (data.error?.message?.includes("User not found")) {
             throw new Error("API Key 已失效或用户未找到 (User not found)。请检查 OpenRouter 账户余额或更换 Key。");
           }
           throw new Error(data.error?.message || `HTTP ${response.status}`);
        }
        
        return data.choices?.[0]?.message?.content || "AI 响应内容为空";
      } catch (err: any) {
        console.warn("OpenRouter 链路异常:", err.message);
        // 如果有备用的 Native API Key，则尝试回退，否则向上抛出错误
        if (!process.env.API_KEY) {
          return `[系统报警] AI 链路异常: ${err.message}\n请管理员检查系统后台 API 设置。`;
        }
      }
    }

    // 回退方案：使用原生的 Gemini SDK
    try {
      if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fallbackModel = (config.preferredModel && !config.preferredModel.includes('/')) ? config.preferredModel : 'gemini-3-flash-preview';
        
        const response = await ai.models.generateContent({
          model: fallbackModel,
          contents: prompt,
          config: systemInstruction ? { systemInstruction, temperature: 0.7 } : { temperature: 0.7 }
        });
        return response.text || "Gemini SDK 响应内容为空";
      }
      return `[配置缺失] 系统未配置有效的 OpenRouter Key。请管理员在“系统设置”中完成配置。`;
    } catch (err: any) {
      console.error("SDK Fallback Error:", err);
      return `[核心链路故障] 无法连接到任何 AI 服务。请检查网络或联系技术支持。`;
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
