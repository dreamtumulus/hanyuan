
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    // If OpenRouter key is configured, use OpenRouter API
    if (config.openRouterKey) {
      const response = await fetch(`${config.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.preferredModel,
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "API 返回异常";
    }

    // Default to Gemini SDK
    // Initialize with guaranteed process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: config.preferredModel.includes("/") ? 'gemini-3-pro-preview' : config.preferredModel,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });
    return response.text || "";
  },

  async analyzeExamReport(content: string, config: SystemConfig, history?: string) {
    const prompt = `【体检数据动态研判】
分析以下警员的体检数据，结合历史记录评估其适岗能力：
内容：${content}
历史背景：${history || '首次录入'}`;
    return this.callAI(prompt, config, "你是一名警队健康管理专家。");
  },

  async getPsychTestResponse(messages: { role: 'user' | 'model'; text: string }[], officerInfo: any, round: number, config: SystemConfig) {
    const systemInstruction = `你是警务心理咨询师。这是第 ${round} 轮对话。当前警员：${JSON.stringify(officerInfo)}. 
请以战友式、接地气的语气交流，严禁打官腔。第10轮需输出正式评估报告。`;
    
    const prompt = messages[messages.length - 1].text;
    return this.callAI(prompt, config, systemInstruction);
  },

  async generateComprehensiveReport(data: { officer: any, exams: any[], psychs: any[], talks: any[] }, config: SystemConfig) {
    const prompt = `【原始数据汇聚】
1. 个人档案：${JSON.stringify(data.officer)}
2. 体检分析：${JSON.stringify(data.exams.map(e => e.analysis))}
3. 心理底色：${JSON.stringify(data.psychs.map(p => p.content))}
4. 谈话记录：${JSON.stringify(data.talks)}

请基于以上数据生成《全维度思想研判报告》。`;

    return this.callAI(prompt, config, REPORT_GENERATION_PROMPT);
  }
};
