'use client';

import { Project } from '@/types';

// GitHubアイコン
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

// Backlogアイコン
function BacklogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 12h8M8 8h8M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// クローン状態を示すバッジ
function CloneStatusBadge({ isCloned, isCloning }: { isCloned: boolean; isCloning: boolean }) {
  if (isCloning) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        準備中
      </span>
    );
  }
  
  if (isCloned) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        準備完了
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      未準備
    </span>
  );
}

interface ProjectListProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateProject: () => void;
  // クローン状態管理用
  cloneStatus?: Record<string, { isCloned: boolean; isCloning: boolean }>;
}

export default function ProjectList({
  projects,
  currentProjectId,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onCreateProject,
  cloneStatus = {},
}: ProjectListProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-700">プロジェクト一覧</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            プロジェクトがありません
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {projects.map((project) => {
              const status = cloneStatus[project.id] || { isCloned: false, isCloning: false };
              const isBacklog = project.repositoryType === 'backlog';
              
              return (
                <li key={project.id} className="group">
                  <div
                    className={`flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 ${
                      currentProjectId === project.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {/* リポジトリタイプアイコン */}
                        {isBacklog ? (
                          <BacklogIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        ) : (
                          <GitHubIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        )}
                        <p
                          className={`truncate text-sm font-medium ${
                            currentProjectId === project.id
                              ? 'text-blue-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {project.name}
                        </p>
                      </div>
                      {project.description && (
                        <p className="truncate text-xs text-gray-500 ml-6">
                          {project.description}
                        </p>
                      )}
                      {/* Backlogプロジェクトの場合はクローン状態を表示 */}
                      {isBacklog && (
                        <div className="mt-1 ml-6">
                          <CloneStatusBadge isCloned={status.isCloned} isCloning={status.isCloning} />
                        </div>
                      )}
                      </button>
                    <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEditProject(project)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        title="編集"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('このプロジェクトを削除しますか？')) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                        title="削除"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={onCreateProject}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新規
        </button>
      </div>
    </div>
  );
}
