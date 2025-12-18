
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  /**
   * 核心 AI 调用逻辑：仅依赖 OpenRouter 链路
   * 不再读取 process.env，所有参数通过 config 传入
   */
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    const key = (config.openRouterKey || "").trim();
    
    if (!key) {
      return "[系统提示] 未配置 API Key。请联系管理员在“系统设置”中输入有效的 OpenRouter Key。";
    }

    try {
      const sanitizedBaseUrl = (config.apiBaseUrl || "https://openrouter.ai/api/v1")
        .trim()
        .replace(/\/$/, "");

      const response = await fetch(`${sanitizedBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Title": "JingXin Guardian"
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
        console.error("OpenRouter API 错误:", data);
        const errorMsg = data.error?.message || `HTTP ${response.status}`;
        
        if (errorMsg.includes("User not found") || errorMsg.includes("invalid_api_key")) {
          return `[系统报警] API Key 已失效或用户不存在。请管理员登录后台更换有效的 OpenRouter Key。 (错误详情: ${errorMsg})`;
        }
        
        if (errorMsg.includes("Insufficient balance") || errorMsg.includes("credits")) {
          return `[系统报警] OpenRouter 账户余额不足，请及时充值。`;
        }

        return `[AI 调用失败] ${errorMsg}`;
      }
    } catch (err: any) {
      console.error("网络请求异常:", err);
      return `[网络异常] 无法连接到 AI 服务，请检查网络状况或 API 基础路径配置。`;
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
