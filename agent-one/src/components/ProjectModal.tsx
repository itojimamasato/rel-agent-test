'use client';

import { useState } from 'react';
import { Project, RepositoryType } from '@/types';
import { storage } from '@/lib/storage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  editingProject?: Project | null;
}

interface ProjectModalFormProps {
  onClose: () => void;
  onSave: (project: Project) => void;
  editingProject?: Project | null;
}

function ProjectModalForm({
  onClose,
  onSave,
  editingProject,
}: ProjectModalFormProps) {
  const [name, setName] = useState(editingProject?.name || '');
  const [description, setDescription] = useState(editingProject?.description || '');
  const [repositoryType, setRepositoryType] = useState<RepositoryType>(
    editingProject?.repositoryType || 'github'
  );
  const [repositoryUrl, setRepositoryUrl] = useState(editingProject?.repositoryUrl || '');
  
  // GitHub用
  const [githubToken, setGithubToken] = useState(editingProject?.githubToken || '');
  
  // Backlog用
  const [backlogDomain, setBacklogDomain] = useState(editingProject?.backlogDomain || '');
  const [backlogProjectKey, setBacklogProjectKey] = useState(editingProject?.backlogProjectKey || '');
  const [backlogApiKey, setBacklogApiKey] = useState(editingProject?.backlogApiKey || '');
  const [backlogEmail, setBacklogEmail] = useState(editingProject?.backlogEmail || '');
  const [backlogGitPassword, setBacklogGitPassword] = useState(editingProject?.backlogGitPassword || '');

  // バリデーション
  const isValid = () => {
    if (!name.trim() || !repositoryUrl.trim()) return false;
    
    if (repositoryType === 'backlog') {
      // 基本設定: ドメイン、プロジェクトキーは必須
      if (!backlogDomain.trim() || !backlogProjectKey.trim()) {
        return false;
      }
      // Git認証: メールアドレス、Gitパスワードは必須
      if (!backlogEmail.trim() || !backlogGitPassword.trim()) {
        return false;
      }
      // API認証: APIキーは任意（課題取得機能を使用しない場合は不要）
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;

    const now = new Date().toISOString();
    const project: Project = {
      id: editingProject?.id || storage.generateId(),
      name: name.trim(),
      description: description.trim(),
      repositoryType,
      repositoryUrl: repositoryUrl.trim(),
      // GitHub用
      githubToken: repositoryType === 'github' ? (githubToken.trim() || undefined) : undefined,
      // Backlog用
      backlogDomain: repositoryType === 'backlog' ? backlogDomain.trim() : undefined,
      backlogProjectKey: repositoryType === 'backlog' ? backlogProjectKey.trim() : undefined,
      backlogApiKey: repositoryType === 'backlog' ? (backlogApiKey.trim() || undefined) : undefined,
      backlogEmail: repositoryType === 'backlog' ? backlogEmail.trim() : undefined,
      backlogGitPassword: repositoryType === 'backlog' ? backlogGitPassword.trim() : undefined,
      createdAt: editingProject?.createdAt || now,
      updatedAt: now,
    };

    onSave(project);
    onClose();
  };

  return (
    <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingProject ? 'プロジェクト編集' : 'プロジェクト作成'}
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* プロジェクト名 */}
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            プロジェクト名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例: My Project"
          />
        </div>

        {/* 説明 */}
        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            説明
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="プロジェクトの説明を入力"
          />
        </div>

        {/* リポジトリタイプ選択 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            リポジトリタイプ <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="repositoryType"
                value="github"
                checked={repositoryType === 'github'}
                onChange={() => setRepositoryType('github')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 text-sm text-gray-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="repositoryType"
                value="backlog"
                checked={repositoryType === 'backlog'}
                onChange={() => setRepositoryType('backlog')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 text-sm text-gray-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M8 12h8M8 8h8M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Backlog
              </span>
            </label>
          </div>
        </div>

        {/* リポジトリURL */}
        <div>
          <label
            htmlFor="repositoryUrl"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            リポジトリURL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="repositoryUrl"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={
              repositoryType === 'github'
                ? 'https://github.com/owner/repo'
                : 'https://xxx.backlog.com/git/PROJECT/repo.git'
            }
          />
        </div>

        {/* GitHub用フィールド */}
        {repositoryType === 'github' && (
          <div>
            <label
              htmlFor="githubToken"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              id="githubToken"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p className="mt-1 text-xs text-gray-500">
              プライベートリポジトリにアクセスする場合に必要です
            </p>
          </div>
        )}

        {/* Backlog用フィールド - 3セクション構成 */}
        {repositoryType === 'backlog' && (
          <div className="space-y-4">
            {/* セクション1: Backlog基本設定 */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Backlog基本設定
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="backlogDomain"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    ドメイン <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="backlogDomain"
                    value={backlogDomain}
                    onChange={(e) => setBacklogDomain(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="xxx.backlog.com または xxx.backlog.jp"
                  />
                </div>
                <div>
                  <label
                    htmlFor="backlogProjectKey"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    プロジェクトキー <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="backlogProjectKey"
                    value={backlogProjectKey}
                    onChange={(e) => setBacklogProjectKey(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="例: MYPROJECT"
                  />
                </div>
              </div>
            </div>

            {/* セクション2: API認証（課題取得用） */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                API認証（課題取得用）
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="backlogApiKey"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    APIキー
                  </label>
                  <input
                    type="password"
                    id="backlogApiKey"
                    value={backlogApiKey}
                    onChange={(e) => setBacklogApiKey(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="APIキーを入力"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Backlog管理画面の個人設定で発行したAPIキーを入力してください。課題取得機能を使用する場合に必要です。
                  </p>
                </div>
              </div>
            </div>

            {/* セクション3: Git認証（ソースコード取得用） */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Git認証（ソースコード取得用）
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="backlogEmail"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="backlogEmail"
                    value={backlogEmail}
                    onChange={(e) => setBacklogEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="example@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Backlogアカウントのメールアドレスを入力してください
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="backlogGitPassword"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Gitパスワード <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="backlogGitPassword"
                    value={backlogGitPassword}
                    onChange={(e) => setBacklogGitPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Gitパスワードを入力"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Backlog個人設定で発行したGitパスワードを入力してください
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!isValid()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingProject ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  editingProject,
}: ProjectModalProps) {
  if (!isOpen) return null;

  const formKey = editingProject?.id || 'new';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <ProjectModalForm
        key={formKey}
        onClose={onClose}
        onSave={onSave}
        editingProject={editingProject}
      />
    </div>
  );
}
