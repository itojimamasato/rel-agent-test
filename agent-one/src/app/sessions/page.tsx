'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  id: string;
  projectId: string;
  messages: SessionMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [sessionsRes, projectsRes] = await Promise.all([
          fetch('/api/sessions'),
          fetch('/api/projects'),
        ]);

        if (!sessionsRes.ok || !projectsRes.ok) {
          throw new Error('データの取得に失敗しました');
        }

        const sessionsData = await sessionsRes.json();
        const projectsData = await projectsRes.json();

        setSessions(sessionsData || []);
        setProjects(projectsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '不明なプロジェクト';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreviewText = (messages: SessionMessage[]) => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      return lastUserMessage.content.slice(0, 100) + (lastUserMessage.content.length > 100 ? '...' : '');
    }
    return 'メッセージなし';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
        <div className="text-red-600">{error}</div>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">チャット履歴</h1>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          チャットに戻る
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 overflow-y-auto border-r border-gray-200 bg-white">
          <div className="p-4">
            <h2 className="mb-4 text-sm font-semibold text-gray-600">
              セッション一覧 ({sessions.length})
            </h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">履歴がありません</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      selectedSession?.id === session.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="mb-1 text-sm font-medium text-gray-900">
                      {getProjectName(session.projectId)}
                    </div>
                    <div className="mb-2 text-xs text-gray-500">
                      {formatDate(session.updatedAt)}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {getPreviewText(session.messages)}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {session.messages.length} メッセージ
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {selectedSession ? (
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getProjectName(selectedSession.projectId)}
                </h3>
                <p className="text-sm text-gray-500">
                  最終更新: {formatDate(selectedSession.updatedAt)}
                </p>
              </div>

              <div className="space-y-4">
                {selectedSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg">
                          {message.role === 'user' ? '👤' : '🤖'}
                        </span>
                        <span className="text-xs opacity-70">
                          {message.role === 'user' ? 'あなた' : 'AGENT-One'}
                        </span>
                        <span className="text-xs opacity-50">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="mb-2 text-4xl">📜</div>
                <p>左側からセッションを選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
