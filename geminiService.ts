
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  /**
   * 使用 Google GenAI SDK 调用 Gemini 模型。
   * 修复了 callAI 的签名以支持可选的系统指令，从而解决外部调用处的参数数量错误。
   */
  async callAI(messages: {role: string, content: string}[] | string, config: SystemConfig, systemInstruction?: string) {
    // 强制遵守指南：API Key 必须排他性地从 process.env.API_KEY 获取
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      // 模型选择：根据指南，基础任务使用 gemini-3-flash-preview，复杂任务使用 gemini-3-pro-preview
      const modelName = config.preferredModel || 'gemini-3-flash-preview';
      
      let contents: any;
      if (typeof messages === 'string') {
        contents = messages;
      } else {
        // 将通用的角色消息转换为 Gemini 的 Content 格式
        contents = messages.map(m => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction || "你是一名专业的警务辅助助手。",
          temperature: 0.7,
        },
      });

      // 指南要求：直接访问 .text 属性，不要调用 .text() 方法
      return response.text || "AI 未返回有效内容";

    } catch (err: any) {
      console.error("Gemini API 异常:", err);
      return `[API 异常] ${err.message}`;
    }
  },

  async analyzeExamReport(content: string, config: SystemConfig, history?: string) {
    const prompt = `分析以下体检数据：${content}\n历史参考：${history || '无'}`;
    // 使用 3 参数调用 callAI
    return this.callAI(prompt, config, "你是一名警务职业健康专家。");
  },

  async getPsychTestResponse(chatMessages: { role: 'user' | 'model'; text: string }[], officerInfo: any, round: number, config: SystemConfig) {
    const formattedHistory = chatMessages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text
    }));

    const systemInstruction = `你是警务心理咨询师。这是第 ${round} 轮对话。当前对象：${officerInfo?.name || '战友'}。请以亲切战友语气交流。第10轮输出评估报告。`;

    // 使用 3 参数调用 callAI
    return this.callAI(formattedHistory, config, systemInstruction);
  },

  async generateComprehensiveReport(data: { officer: any, exams: any[], psychs: any[], talks: any[] }, config: SystemConfig) {
    const context = `
      民警: ${data.officer?.name} (${data.officer?.policeId})
      体检: ${JSON.stringify(data.exams.map(e => e.analysis))}
      测评: ${JSON.stringify(data.psychs.map(p => p.content))}
      谈话: ${JSON.stringify(data.talks)}
    `;
    // 使用 3 参数调用 callAI
    return this.callAI(context, config, REPORT_GENERATION_PROMPT);
  }
};