/**
 * SSE 流式对话专用 Route Handler
 */

import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { chat_id: string } },
) {
  const { chat_id } = params;
  const body = await request.text();

  // 直接请求后端，不经过 Next.js rewrite
  const backendRes = await fetch(
    `${BACKEND_URL}/api/ragflow/chat-assistants/${chat_id}/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 明确禁止后端压缩，确保原始 SSE 文本流
        'Accept-Encoding': 'identity',
      },
      body,
      // @ts-expect-error: Node.js fetch duplex 选项
      duplex: 'half',
    },
  );

  if (!backendRes.ok) {
    const errText = await backendRes.text();
    return new Response(errText, { status: backendRes.status });
  }

  // 原样透传 SSE 流，设置正确的响应头
  return new Response(backendRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // 禁止 Next.js / nginx 对此响应再做压缩或缓冲
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'identity',
    },
  });
}