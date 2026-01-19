// リポジトリタイプの定義
export type RepositoryType = 'github' | 'backlog';

export interface Project {
  id: string;
  name: string;
  description: string;
  repositoryType: RepositoryType;  // リポジトリタイプ
  repositoryUrl: string;
  
  // GitHub用認証情報
  githubToken?: string;
  
  // Backlog用認証情報
  backlogDomain?: string;       // Backlogドメイン（例: xxx.backlog.com）
  backlogProjectKey?: string;   // Backlogプロジェクトキー
  backlogApiKey?: string;       // Backlog APIキー（課題取得用）
  backlogEmail?: string;        // Backlogメールアドレス（Git認証用）
  backlogGitPassword?: string;  // Backlog Gitパスワード（Git認証用）
  
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  projectId: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  error?: string;
}
