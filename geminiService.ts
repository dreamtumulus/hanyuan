
import { SystemConfig } from "./types";
import { REPORT_GENERATION_PROMPT } from "./constants";

export const geminiService = {
  /**
   * 核心 AI 调用逻辑
   * 严格遵循 OpenRouter 浏览器端调用规范
   */
  async callAI(prompt: string, config: SystemConfig, systemInstruction?: string) {
    // 1. 获取并极端净化 Key
    const key = (config.openRouterKey || "").trim();
    
    if (!key || key.startsWith("sk-or-v1-d0d8")) { // 过滤掉已知失效的占位符
      return "[系统提示] 当前使用的 API Key 可能已失效或未配置。请点击左侧导航栏底部的“系统设置”更新您的 OpenRouter Key。";
    }

    try {
      const sanitizedBaseUrl = (config.apiBaseUrl || "https://openrouter.ai/api/v1")
        .trim()
        .replace(/\/$/, "");

      // OpenRouter 在浏览器环境极其看重这两个 Header
      const referer = window.location.origin || "https://jingxin-guardian.vercel.app";
      const title = "警心卫士分析系统";

      const response = await fetch(`${sanitizedBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer, 
          "X-Title": title
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
      
      if (response.ok) {
        return data.choices?.[0]?.message?.content || "AI 响应内容为空";
      } else {
        console.error("OpenRouter 返回错误详情:", data);
        const errorDetail = data.error?.message || JSON.stringify(data.error);
        
        // 针对性错误引导
        if (errorDetail.includes("User not found") || errorDetail.includes("invalid_api_key")) {
          return `[鉴权失败] OpenRouter 无法识别此 Key。请检查：\n1. Key 是否被删除或禁用\n2. 是否有余额\n3. 在“系统设置”中重新粘贴 Key 并保存。`;
        }
        
        if (errorDetail.includes("Insufficient balance") || errorDetail.includes("credits")) {
          return `[余额不足] 您的 OpenRouter 账户已欠费。请前往 openrouter.ai 充值。`;
        }

        return `[接口返回报错] ${errorDetail}`;
      }
    } catch (err: any) {
      console.error("底层网络异常:", err);
      return `[网络连接异常] 无法触达 AI 服务器。可能原因：\n1. 您当前的防火墙/VPN 拦截了请求\n2. API 基础路径填写错误。`;
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
