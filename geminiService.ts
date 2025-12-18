
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  /**
   * 核心 AI 调用逻辑
   * 优先尝试用户配置的 OpenRouter Key，若失败或未配置且环境有 API_KEY，则回退至原生 Gemini SDK
   */
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    const key = (config.openRouterKey || "").trim();
    
    // 如果配置了 OpenRouter Key，优先走 OpenRouter 链路
    if (key !== "") {
      try {
        const sanitizedBaseUrl = (config.apiBaseUrl || "https://openrouter.ai/api/v1")
          .trim()
          .replace(/\/$/, "");

        const response = await fetch(`${sanitizedBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin, // OpenRouter 要求的来源校验
            "X-Title": "警心卫士系统" 
          },
          body: JSON.stringify({
            model: config.preferredModel || "google/gemini-3-flash-preview",
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
          const errorMsg = data.error?.message || `HTTP ${response.status}`;
          console.error("OpenRouter API Error:", errorMsg);
          
          // 针对性捕获 "User not found"
          if (errorMsg.includes("User not found") || errorMsg.includes("invalid_api_key")) {
            return `[鉴权失败] OpenRouter 无法识别该 API Key。请检查 Key 是否正确，或账户余额是否充足。 (报错详情: ${errorMsg})`;
          }
          return `[接口返回错误] ${errorMsg}`;
        }
      } catch (err: any) {
        console.warn("网络请求异常:", err.message);
        return `[网络异常] 无法连接到 AI 服务器，请检查您的网络环境或 API 地址。`;
      }
    }

    // 回退方案：使用原生 Gemini SDK (由环境 process.env.API_KEY 驱动)
    try {
      // Fix: Use ai.models.generateContent directly instead of deprecated getGenerativeModel
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = config.preferredModel?.includes('/') ? 'gemini-3-flash-preview' : (config.preferredModel || 'gemini-3-flash-preview');
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction 
        }
      });
      
      // Fix: Use .text property instead of text() method
      return response.text || "原生 SDK 响应内容为空";
    } catch (err: any) {
      console.error("原生 SDK 异常:", err);
      return `[全链路故障] 当前 API Key 无效且原生服务不可用。请在“系统设置”中配置有效的 OpenRouter API Key。`;
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
