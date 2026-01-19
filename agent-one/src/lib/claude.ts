import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';

interface ClaudeRequest {
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

interface ClaudeResponse {
  message: string;
  sessionId: string;
  error?: string;
}

interface StreamJsonMessage {
  type: string;
  subtype?: string;
  content?: string;
  result?: string;
  session_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'result' | 'error';
  content: string;
  toolName?: string;
}

export type StreamCallback = (event: StreamEvent) => void;

const SYSTEM_PROMPT = `あなたはAGENT-Oneというアプリ保守に特化したAIエージェントです。
ユーザーは営業担当やエンジニアで、既存アプリケーションについての様々な調査をあなたに依頼します。

あなたの主な役割:
1. ソースコードを解析し、機能の使い方を説明する
2. 機能追加の工数見積りを支援する
3. GitHub IssueやBacklog課題とコードをAIが横断的に調査してバグ調査を支援する

回答する際は:
- 技術的な詳細を含めつつ、分かりやすく説明してください
- 必要に応じてコード例やファイルパスを示してください
- 工数見積りの場合は、作業項目と時間を表形式で示してください
- Markdown形式で回答してください

ローカルリポジトリについて:
- Backlogリポジトリは repos/ ディレクトリ配下にクローンされています
- クローンされたリポジトリのパスは repos/{projectId} の形式です
- ローカルリポジトリのファイルを読み取る場合は、Read ツールを使用してください
- リポジトリがクローンされているかどうかは、repos/{projectId}/.git ディレクトリの存在で確認できます`;

export async function callClaude(request: ClaudeRequest): Promise<ClaudeResponse> {
  const sessionId = request.sessionId || generateSessionId();

  let prompt = request.message;

  if (request.conversationHistory && request.conversationHistory.length > 0) {
    const historyText = request.conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    prompt = `以下は会話履歴です:\n\n${historyText}\n\nUser: ${request.message}`;
  }

  if (request.repositoryUrl) {
    prompt += `\n\n対象リポジトリ: ${request.repositoryUrl}`;
  }

  const mcpConfigPath = path.join(process.cwd(), 'mcp-servers.json');

  const args = [
    '-p',
    prompt,
    '--verbose',
    '--output-format',
    'stream-json',
    '--allowedTools',
    'Bash,Read,Write,Edit,mcp__github,mcp__backlog',
    '--append-system-prompt',
    SYSTEM_PROMPT,
    '--mcp-config',
    mcpConfigPath,
  ];

  return new Promise<ClaudeResponse>((resolve) => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
    };

    if (request.githubToken) {
      env.GITHUB_PAT = request.githubToken;
    }

    const child = spawn('claude', args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      console.error('Claude Code CLI failed to start:', err);
      resolve({
        message: '',
        sessionId,
        error: 'Claude Code CLI の起動に失敗しました。CLIがインストールされているか確認してください。',
      });
    });

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error('Claude Code CLI exited with code:', code, stderr);
        resolve({
          message: '',
          sessionId,
          error: stderr || `Claude Code CLI が終了コード ${code} で終了しました`,
        });
        return;
      }

      const responseMessage = parseStreamJsonOutput(stdout);

      if (!responseMessage) {
        console.error('Failed to parse Claude CLI output:', stdout);
        resolve({
          message: stdout.trim() || 'AIからの応答を解析できませんでした',
          sessionId,
        });
        return;
      }

      resolve({
        message: responseMessage,
        sessionId,
      });
    });

    child.stdin.end();
  });
}

interface ClaudeStreamResult {
  child: ChildProcess;
  sessionId: string;
}

export function callClaudeStream(
  request: ClaudeRequest,
  onEvent: StreamCallback
): ClaudeStreamResult {
  const sessionId = request.sessionId || generateSessionId();

  let prompt = request.message;

  if (request.conversationHistory && request.conversationHistory.length > 0) {
    const historyText = request.conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    prompt = `以下は会話履歴です:\n\n${historyText}\n\nUser: ${request.message}`;
  }

  if (request.repositoryUrl) {
    prompt += `\n\n対象リポジトリ: ${request.repositoryUrl}`;
  }

  const mcpConfigPath = path.join(process.cwd(), 'mcp-servers.json');

  const args = [
    '-p',
    prompt,
    '--verbose',
    '--output-format',
    'stream-json',
    '--allowedTools',
    'Bash,Read,Write,Edit,mcp__github,mcp__backlog',
    '--append-system-prompt',
    SYSTEM_PROMPT,
    '--mcp-config',
    mcpConfigPath,
  ];

  const env: NodeJS.ProcessEnv = {
    ...process.env,
  };

  if (request.githubToken) {
    env.GITHUB_PAT = request.githubToken;
  }

  const child = spawn('claude', args, {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    buffer += chunk;

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line) as StreamJsonMessage;
        const event = parseStreamJsonMessage(parsed);
        if (event) {
          onEvent(event);
        }
      } catch {
        continue;
      }
    }
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    console.error('Claude CLI stderr:', chunk);
  });

  child.on('error', (err) => {
    console.error('Claude Code CLI failed to start:', err);
    onEvent({
      type: 'error',
      content: 'Claude Code CLI の起動に失敗しました。CLIがインストールされているか確認してください。',
    });
  });

  child.on('close', (code) => {
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer) as StreamJsonMessage;
        const event = parseStreamJsonMessage(parsed);
        if (event) {
          onEvent(event);
        }
      } catch {
        // ignore
      }
    }

    if (code !== 0 && code !== null) {
      onEvent({
        type: 'error',
        content: `Claude Code CLI が終了コード ${code} で終了しました`,
      });
    }
  });

  child.stdin.end();

  return { child, sessionId };
}

function parseStreamJsonMessage(parsed: StreamJsonMessage): StreamEvent | null {
  if (parsed.type === 'assistant' && parsed.subtype === 'text' && parsed.content) {
    return {
      type: 'text',
      content: parsed.content,
    };
  }

  if (parsed.type === 'assistant' && parsed.subtype === 'tool_use' && parsed.tool_name) {
    return {
      type: 'tool_use',
      content: `ツール実行中: ${parsed.tool_name}`,
      toolName: parsed.tool_name,
    };
  }

  if (parsed.type === 'result' && parsed.result) {
    return {
      type: 'result',
      content: parsed.result,
    };
  }

  return null;
}

function parseStreamJsonOutput(output: string): string {
  const lines = output.trim().split('\n');
  const textParts: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line) as StreamJsonMessage;

      if (parsed.type === 'assistant' && parsed.subtype === 'text' && parsed.content) {
        textParts.push(parsed.content);
      }

      if (parsed.type === 'result' && parsed.result) {
        return parsed.result;
      }
    } catch {
      continue;
    }
  }

  return textParts.join('');
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
