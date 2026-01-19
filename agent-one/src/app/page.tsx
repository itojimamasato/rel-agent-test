'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Project, Message } from '@/types';
import ProjectList from '@/components/ProjectList';
import ProjectModal from '@/components/ProjectModal';
import ChatArea from '@/components/ChatArea';
import ChatInput from '@/components/ChatInput';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// クローン状態の型定義
interface CloneStatusMap {
  [projectId: string]: {
    isCloned: boolean;
    isCloning: boolean;
  };
}

// エラー通知コンポーネント
function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg">
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 rounded p-1 hover:bg-red-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// 成功通知コンポーネント
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 rounded p-1 hover:bg-green-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // クローン状態管理
  const [cloneStatus, setCloneStatus] = useState<CloneStatusMap>({});
  
  // トースト通知
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // クローン状態を確認する関数
  const checkCloneStatus = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/repo/status?projectId=${projectId}`);
      const data = await response.json();
      
      setCloneStatus((prev) => ({
        ...prev,
        [projectId]: {
          isCloned: data.isCloned,
          isCloning: false,
        },
      }));
      
      return data.isCloned;
    } catch (error) {
      console.error('クローン状態の確認に失敗しました:', error);
      return false;
    }
  }, []);

  // Backlogリポジトリをクローンする関数
  const cloneBacklogRepository = useCallback(async (project: Project) => {
    if (project.repositoryType !== 'backlog') return true;
    
    // クローン中状態に設定
    setCloneStatus((prev) => ({
      ...prev,
      [project.id]: {
        isCloned: false,
        isCloning: true,
      },
    }));

    try {
      const response = await fetch('/api/repo/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          repositoryUrl: project.repositoryUrl,
          backlogEmail: project.backlogEmail,
          backlogGitPassword: project.backlogGitPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCloneStatus((prev) => ({
          ...prev,
          [project.id]: {
            isCloned: true,
            isCloning: false,
          },
        }));
        setSuccessMessage('リポジトリのクローンが完了しました');
        setTimeout(() => setSuccessMessage(null), 3000);
        return true;
      } else {
        setCloneStatus((prev) => ({
          ...prev,
          [project.id]: {
            isCloned: false,
            isCloning: false,
          },
        }));
        setErrorMessage(`クローンに失敗しました: ${data.message}`);
        setTimeout(() => setErrorMessage(null), 5000);
        return false;
      }
    } catch (error) {
      console.error('クローン処理でエラーが発生しました:', error);
      setCloneStatus((prev) => ({
        ...prev,
        [project.id]: {
          isCloned: false,
          isCloning: false,
        },
      }));
      setErrorMessage('クローン処理でエラーが発生しました');
      setTimeout(() => setErrorMessage(null), 5000);
      return false;
    }
  }, []);

  // プロジェクト一覧をAPIから取得
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        return data as Project[];
      }
      return [];
    } catch (error) {
      console.error('プロジェクト取得エラー:', error);
      return [];
    }
  }, []);

  // セッションをAPIから取得
  const fetchSession = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/sessions?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.messages) {
          setMessages(data.messages.map((m: { id: string; role: string; content: string; timestamp: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp,
          })));
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('セッション取得エラー:', error);
      setMessages([]);
    }
  }, []);

  // セッションをAPIに保存
  const saveSession = useCallback(async (projectId: string, sessionMessages: Message[]) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          messages: sessionMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
    } catch (error) {
      console.error('セッション保存エラー:', error);
    }
  }, []);

  // 初期ロード時にプロジェクトとクローン状態を確認
  useEffect(() => {
    const loadData = async () => {
      const loadedProjects = await fetchProjects();
      
      // localStorageから現在のプロジェクトIDを取得（一時的な互換性のため）
      const savedProjectId = typeof window !== 'undefined' 
        ? localStorage.getItem('agent-one-current-project') 
        : null;
      
      if (savedProjectId && loadedProjects.some((p: Project) => p.id === savedProjectId)) {
        setCurrentProjectId(savedProjectId);
        await fetchSession(savedProjectId);
      }
      
      // Backlogプロジェクトのクローン状態を確認
      loadedProjects.forEach((project: Project) => {
        if (project.repositoryType === 'backlog') {
          checkCloneStatus(project.id);
        }
      });
    };
    
    loadData();
  }, [fetchProjects, fetchSession, checkCloneStatus]);

  const handleSelectProject = async (projectId: string) => {
    setCurrentProjectId(projectId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent-one-current-project', projectId);
    }
    await fetchSession(projectId);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchProjects();
        if (currentProjectId === projectId) {
          setCurrentProjectId(null);
          setMessages([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('agent-one-current-project');
          }
        }
      }
    } catch (error) {
      console.error('プロジェクト削除エラー:', error);
      setErrorMessage('プロジェクトの削除に失敗しました');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      let savedProject: Project;
      
      if (editingProject) {
        const response = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('更新に失敗しました');
        savedProject = await response.json();
      } else {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('作成に失敗しました');
        savedProject = await response.json();
      }
      
      await fetchProjects();
      
      // Backlogプロジェクトの場合はクローン処理を開始
      if (savedProject.repositoryType === 'backlog') {
        const isAlreadyCloned = await checkCloneStatus(savedProject.id);
        
        if (!isAlreadyCloned) {
          cloneBacklogRepository(savedProject);
        }
      }
      
      if (!currentProjectId) {
        handleSelectProject(savedProject.id);
      }
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      setErrorMessage('プロジェクトの保存に失敗しました');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentProjectId) return;

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
          projectId: currentProjectId,
          repositoryUrl: currentProject?.repositoryUrl,
          githubToken: currentProject?.githubToken,
          conversationHistory,
        }),
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
            const event = JSON.parse(dataMatch[1]) as {
              type: string;
              content: string;
              sessionId?: string;
              toolName?: string;
            };

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
            ? { ...m, content: accumulatedContent || 'AIからの応答がありませんでした', isLoading: false }
            : m
        );

        saveSession(currentProjectId, finalMessages);

        return finalMessages;
      });
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">AGENT-One</h1>
          <Link
            href="/sessions"
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            履歴
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">プロジェクト選択:</span>
          <select
            value={currentProjectId || ''}
            onChange={(e) => {
              if (e.target.value) {
                handleSelectProject(e.target.value);
              }
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ProjectList
          projects={projects}
          currentProjectId={currentProjectId}
          onSelectProject={handleSelectProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onCreateProject={handleCreateProject}
          cloneStatus={cloneStatus}
        />
        <div className="flex flex-1 flex-col">
          <ChatArea
            messages={messages}
            projectName={currentProject?.name}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={!currentProjectId || isLoading}
          />
        </div>
      </div>
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        editingProject={editingProject}
      />
      
      {/* トースト通知 */}
      {errorMessage && (
        <ErrorToast message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}
