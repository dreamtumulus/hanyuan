
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    // 优先检查是否配置了 OpenRouter (通过 API Key 判断)
    if (config.openRouterKey && config.openRouterKey.trim() !== "") {
      try {
        const response = await fetch(`${config.apiBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.openRouterKey.trim()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin, // OpenRouter 要求的域名标识
            "X-Title": "JingXin Guardian System" // 修复：必须使用英文，避免 "non ISO-8859-1 code point" 错误
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
        if (data.error) {
          console.error("OpenRouter Error:", data.error);
          throw new Error(data.error.message || "OpenRouter 接口返回错误");
        }
        return data.choices?.[0]?.message?.content || "AI 响应解析失败";
      } catch (err: any) {
        console.warn("OpenRouter 链路异常，尝试本地回退:", err.message);
        // 如果是因为 API Key 格式或网络问题，返回具体错误
        if (err.message.includes('ISO-8859-1')) {
          return `[系统配置错误] 您的 API Key 或配置包含非法字符，请重新输入。`;
        }
        return `[系统警告] OpenRouter 接入失败: ${err.message}。请检查 API Key 余额。`;
      }
    }

    // 回退方案：使用原生的 Gemini SDK (需要 Vercel 注入 process.env.API_KEY)
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 如果 PreferredModel 看起来像 OpenRouter 路径，回退时使用默认的 Flash
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
    const prompt = `【生理研判指令】\n分析以下体检数据，对比历史趋势，评估其高压勤务适岗度。\n当前数据：${content}\n历史参考：${history || '无'}`;
    return this.callAI(prompt, config, "你是一名警务职业健康专家。");
  },

  async getPsychTestResponse(messages: { role: 'user' | 'model'; text: string }[], officerInfo: any, round: number, config: SystemConfig) {
    const systemInstruction = `你是心理疏导员。这是第 ${round} 轮隐蔽式对话。当前对象：${officerInfo?.name || '匿名民警'}。请以战友语气进行压力评估。`;
    const lastMessage = messages[messages.length - 1].text;
    return this.callAI(lastMessage, config, systemInstruction);
  },

  async generateComprehensiveReport(data: { officer: any, exams: any[], psychs: any[], talks: any[] }, config: SystemConfig) {
    const context = `
    民警姓名: ${data.officer?.name}
    部门职位: ${data.officer?.dept || data.officer?.department} / ${data.officer?.position}
    体检记录: ${JSON.stringify(data.exams.map(e => e.analysis))}
    心理测评总结: ${JSON.stringify(data.psychs.map(p => p.content))}
    谈话风险标记: ${JSON.stringify(data.talks)}
    `;
    return this.callAI(context, config, REPORT_GENERATION_PROMPT);
  }
};
