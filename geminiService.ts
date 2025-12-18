
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    // 优先检查是否配置了 OpenRouter (通过 API Key 判断)
    if (config.openRouterKey && config.openRouterKey.trim() !== "") {
      try {
        /**
         * 关键修复逻辑：
         * 浏览器 fetch API 的 Headers 对象仅支持 ISO-8859-1 字符集。
         * 如果 API Key 中包含中文空格（U+3000）或用户意外输入的非 ASCII 字符，fetch 会直接报错。
         * 我们在此处强制过滤掉所有非 ASCII 字符 (range 0-127)。
         */
        const sanitizedKey = config.openRouterKey.replace(/[^\x00-\x7F]/g, "").trim();
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
            temperature: 0.7,
            top_p: 0.9
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || `HTTP 错误: ${response.status}`);
        }

        if (data.error) {
          console.error("OpenRouter 业务错误:", data.error);
          throw new Error(data.error.message || "OpenRouter 接口返回错误");
        }
        
        return data.choices?.[0]?.message?.content || "AI 响应内容为空，请检查模型是否可用";
      } catch (err: any) {
        console.warn("OpenRouter 链路异常:", err.message);
        
        // 捕获 Headers 导致的特定错误并给出极简的修复建议
        if (err.message.includes('ISO-8859-1') || err.message.includes('headers') || err.message.includes('fetch')) {
          return `[配置错误] 您的 API Key 或路径包含非法字符（如全角空格）。请在“系统设置”中删除并重新手动输入 API Key。`;
        }
        
        return `[系统警告] 研判请求失败: ${err.message}。建议检查 API Key 余额或网络连接。`;
      }
    }

    // 回退方案：使用原生的 Gemini SDK (需要 Vercel 注入 process.env.API_KEY)
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fallbackModel = config.preferredModel.includes('/') ? 'gemini-3-flash-preview' : config.preferredModel;
      
      const response = await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
        config: systemInstruction ? { systemInstruction, temperature: 0.7 } : { temperature: 0.7 }
      });
      return response.text || "Gemini SDK 响应内容为空";
    } catch (err: any) {
      console.error("SDK Fallback Error:", err);
      return `[核心链路故障] 无法连接到 AI 服务，请在系统设置中配置有效的 OpenRouter API Key。`;
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
    部门职位: ${data.officer?.dept || data.officer?.department} / ${data.officer?.position}
    体检摘要: ${JSON.stringify(data.exams.map(e => e.analysis))}
    心理摘要: ${JSON.stringify(data.psychs.map(p => p.content))}
    谈话摘要: ${JSON.stringify(data.talks)}
    `;
    return this.callAI(context, config, REPORT_GENERATION_PROMPT);
  }
};
