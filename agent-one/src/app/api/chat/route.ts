import { NextRequest, NextResponse } from 'next/server';
import { callClaudeStream, StreamEvent } from '@/lib/claude';

export const runtime = 'nodejs';

interface ChatRequest {
  message: string;
  projectId: string;
  repositoryUrl?: string;
  githubToken?: string;
  sessionId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message) {
      return NextResponse.json(
        {
          message: '',
          sessionId: '',
          error: 'メッセージが入力されていません',
        },
        { status: 400 }
      );
    }

    if (!body.projectId) {
      return NextResponse.json(
        {
          message: '',
          sessionId: '',
          error: 'プロジェクトが選択されていません',
        },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const { child, sessionId } = callClaudeStream(
          {
            message: body.message,
            projectId: body.projectId,
            repositoryUrl: body.repositoryUrl,
            githubToken: body.githubToken,
            sessionId: body.sessionId,
            conversationHistory: body.conversationHistory,
          },
          (event: StreamEvent) => {
            const data = `data: ${JSON.stringify({ ...event, sessionId })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        );

        child.on('close', () => {
          controller.close();
        });

        child.on('error', () => {
          controller.close();
        });

        request.signal.addEventListener('abort', () => {
          child.kill();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        message: '',
        sessionId: '',
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
