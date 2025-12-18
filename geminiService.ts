
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const geminiService = {
  async analyzeExamReport(content: string, history?: string) {
    const ai = getAI();
    const prompt = `分析以下警察的体检报告，指出关键健康指标、潜在风险，并与之前的趋势对比（如果有）：\n内容：${content}\n历史记录：${history || '无'}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  },

  async getPsychTestResponse(messages: { role: 'user' | 'model'; text: string }[], officerInfo: any, round: number) {
    const ai = getAI();
    const systemInstruction = `你是警务心理咨询师。这是第 ${round} 轮对话。当前用户信息：${JSON.stringify(officerInfo)}. \n\n【核心指令】:\n1. 语气亲切懂行。\n2. 保持对话自然。\n3. 如果是第10轮，生成最终报告。\n4. 使用警务术语。`;
    
    const contents = messages.map(m => ({
      parts: [{ text: m.text }],
      role: m.role === 'user' ? 'user' : 'model'
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  },

  async generateComprehensiveReport(data: { officer: any, exams: any[], psychs: any[], talks: any[] }) {
    const ai = getAI();
    const prompt = `基于以下数据生成《警员全维度身心状况研判报告》：
    个人资料：${JSON.stringify(data.officer)}
    体检摘要：${JSON.stringify(data.exams.map(e => e.analysis))}
    心理测试结论：${JSON.stringify(data.psychs.map(p => p.content))}
    谈心谈话记录：${JSON.stringify(data.talks)}
    
    必须严格遵循PRD中的加权分逻辑和输出格式。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  }
};
