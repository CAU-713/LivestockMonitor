/**
 * 聊天服务
 * 仅使用模拟数据
 */

import { defaultChatResponse } from '@/constants/mockData';

interface ChatResponse {
  answer: string;
  session_id: string;
  references?: Array<{
    content: string;
    document_name: string;
    similarity: number;
  }>;
}

class ChatService {
  private sessionId: string = '';

  /**
   * 创建新会话
   */
  async createSession(): Promise<string> {
    // 生成本地模拟会话ID
    this.sessionId = `session-${Date.now()}`;
    return this.sessionId;
  }

  /**
   * 发送消息到聊天（返回模拟数据）
   */
  async sendMessage(question: string, sessionId: string): Promise<ChatResponse> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    return {
      answer: defaultChatResponse.answer,
      session_id: sessionId,
      references: defaultChatResponse.references,
    };
  }

  /**
   * 流式发送消息（返回模拟数据）
   */
  async sendMessageStream(
    question: string,
    sessionId: string,
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse> {
    // 模拟流式传输，将答案分块发送
    const answer = defaultChatResponse.answer;
    const chunkSize = 20;

    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.slice(i, i + chunkSize);
      onChunk(chunk);
      // 模拟流传输的延迟
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50));
    }

    return {
      answer: answer,
      session_id: sessionId,
      references: defaultChatResponse.references,
    };
  }
}

// 导出单例实例
export const chatService = new ChatService();
