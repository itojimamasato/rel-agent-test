'use client';

import { useState, useCallback, useRef } from 'react';
import { Message } from '@/types';

interface StreamEvent {
  type: 'text' | 'tool_use' | 'result' | 'error';
  content: string;
  sessionId?: string;
  toolName?: string;
}

interface UseChatOptions {
  projectId: string | null;
  repositoryUrl?: string;
  githubToken?: string;
  onSessionSave?: (projectId: string, messages: Message[]) => void;
}

interface UseChatReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  abortStream: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useChat({
  projectId,
  repositoryUrl,
  githubToken,
  onSessionSave,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId || isLoading) return;

      const userMessageId = generateId();
      const assistantMessageId = generateId();

      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      const loadingMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setIsLoading(true);

      abortControllerRef.current = new AbortController();
      let accumulatedContent = '';

      try {
        const conversationHistory = messages
          .filter((m) => !m.isLoading)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            projectId,
            repositoryUrl,
            githubToken,
            conversationHistory,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'APIエラーが発生しました');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ストリームの読み取りに失敗しました');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const dataMatch = line.match(/^data: (.+)$/);
            if (!dataMatch) continue;

            try {
              const event = JSON.parse(dataMatch[1]) as StreamEvent;

              if (event.type === 'text') {
                accumulatedContent += event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedContent, isLoading: true }
                      : m
                  )
                );
              } else if (event.type === 'tool_use') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: accumulatedContent || event.content,
                          isLoading: true,
                        }
                      : m
                  )
                );
              } else if (event.type === 'result') {
                accumulatedContent = event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: event.content, isLoading: false }
                      : m
                  )
                );
              } else if (event.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: event.content, isLoading: false }
                      : m
                  )
                );
              }
            } catch {
              continue;
            }
          }
        }

        setMessages((prev) => {
          const finalMessages = prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: accumulatedContent || 'AIからの応答がありませんでした',
                  isLoading: false,
                }
              : m
          );

          if (onSessionSave) {
            onSessionSave(projectId, finalMessages);
          }

          return finalMessages;
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: accumulatedContent || '中断されました', isLoading: false }
                : m
            )
          );
        } else {
          const errorContent =
            error instanceof Error
              ? error.message
              : 'APIへの接続に失敗しました。しばらくしてから再度お試しください。';

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: errorContent, isLoading: false }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [projectId, repositoryUrl, githubToken, messages, isLoading, onSessionSave]
  );

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    abortStream,
  };
}
