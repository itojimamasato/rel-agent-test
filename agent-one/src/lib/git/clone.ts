import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

// クローン結果の型定義
export interface CloneResult {
  success: boolean;
  localPath: string;
  message: string;
  error?: string;
}

// クローンオプションの型定義
export interface CloneOptions {
  projectId: string;
  repositoryUrl: string;
  // Backlog Git認証用（メールアドレス+Gitパスワード方式）
  backlogEmail?: string;
  backlogGitPassword?: string;
}

// プロジェクトルートからの相対パスでreposディレクトリを取得
const getReposBaseDir = (): string => {
  // プロジェクトルート（agent-one）からの相対パス
  return resolve(process.cwd(), 'repos');
};

// reposディレクトリの初期化（存在しない場合は作成し、.gitkeepを配置）
export const initializeReposDirectory = (): void => {
  const reposDir = getReposBaseDir();
  
  if (!existsSync(reposDir)) {
    mkdirSync(reposDir, { recursive: true });
    console.log(`リポジトリディレクトリを作成しました: ${reposDir}`);
  }
  
  // .gitkeepファイルを配置してディレクトリを保持
  const gitkeepPath = join(reposDir, '.gitkeep');
  if (!existsSync(gitkeepPath)) {
    writeFileSync(gitkeepPath, '');
    console.log(`.gitkeepファイルを作成しました: ${gitkeepPath}`);
  }
};

// クローン先のローカルパスを取得
export const getClonePath = (projectId: string): string => {
  return join(getReposBaseDir(), projectId);
};

// リポジトリが既にクローン済みかどうかを確認
export const isRepositoryCloned = (projectId: string): boolean => {
  const clonePath = getClonePath(projectId);
  const gitDir = join(clonePath, '.git');
  return existsSync(gitDir);
};

// 認証情報を含むURLを生成（Backlog Git認証用：メールアドレス+Gitパスワード方式）
const buildAuthenticatedUrl = (
  repositoryUrl: string,
  backlogEmail?: string,
  backlogGitPassword?: string
): string => {
  if (!backlogEmail || !backlogGitPassword) {
    return repositoryUrl;
  }
  
  try {
    const url = new URL(repositoryUrl);
    // メールアドレスをURLエンコードして設定（@などの特殊文字対応）
    url.username = encodeURIComponent(backlogEmail);
    // Gitパスワードを設定（ログには出力しない）
    url.password = encodeURIComponent(backlogGitPassword);
    return url.toString();
  } catch {
    // URLパースに失敗した場合は元のURLを返す
    console.error('URLのパースに失敗しました。元のURLを使用します。');
    return repositoryUrl;
  }
};

// git cloneを実行（Backlog Git認証：メールアドレス+Gitパスワード方式対応）
export const cloneRepository = async (options: CloneOptions): Promise<CloneResult> => {
  const { projectId, repositoryUrl, backlogEmail, backlogGitPassword } = options;
  
  // reposディレクトリを初期化
  initializeReposDirectory();
  
  const localPath = getClonePath(projectId);
  
  // 既にクローン済みの場合
  if (isRepositoryCloned(projectId)) {
    return {
      success: true,
      localPath,
      message: 'リポジトリは既にクローン済みです。',
    };
  }
  
  // クローン先ディレクトリが存在する場合は削除（.gitがない不完全な状態）
  if (existsSync(localPath)) {
    console.log(`不完全なディレクトリを検出しました。再クローンを実行します: ${localPath}`);
  }
  
  // 認証情報を含むURLを生成（メールアドレス+Gitパスワード方式）
  const authenticatedUrl = buildAuthenticatedUrl(repositoryUrl, backlogEmail, backlogGitPassword);
  
  return new Promise((resolve) => {
    console.log(`リポジトリのクローンを開始します: ${repositoryUrl}`);
    console.log(`クローン先: ${localPath}`);
    
    const gitProcess = spawn('git', ['clone', authenticatedUrl, localPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let stderr = '';
    
    gitProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[git clone stdout]: ${output}`);
    });
    
    gitProcess.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      stderr += output;
      // gitは進捗情報をstderrに出力するため、エラーとは限らない
      console.log(`[git clone stderr]: ${output}`);
    });
    
    gitProcess.on('close', (code: number | null) => {
      if (code === 0) {
        console.log('リポジトリのクローンが完了しました。');
        resolve({
          success: true,
          localPath,
          message: 'リポジトリのクローンが正常に完了しました。',
        });
      } else {
        const errorMessage = stderr || `git cloneが終了コード ${code} で失敗しました。`;
        console.error(`リポジトリのクローンに失敗しました: ${errorMessage}`);
        resolve({
          success: false,
          localPath,
          message: 'リポジトリのクローンに失敗しました。',
          error: errorMessage,
        });
      }
    });
    
    gitProcess.on('error', (error: Error) => {
      console.error(`git cloneプロセスでエラーが発生しました: ${error.message}`);
      resolve({
        success: false,
        localPath,
        message: 'git cloneプロセスの起動に失敗しました。',
        error: error.message,
      });
    });
  });
};

// git pullを実行（既存リポジトリの更新用）
export const pullRepository = async (projectId: string): Promise<CloneResult> => {
  const localPath = getClonePath(projectId);
  
  if (!isRepositoryCloned(projectId)) {
    return {
      success: false,
      localPath,
      message: 'リポジトリがクローンされていません。先にcloneRepositoryを実行してください。',
    };
  }
  
  return new Promise((resolve) => {
    console.log(`リポジトリの更新を開始します: ${localPath}`);
    
    const gitProcess = spawn('git', ['pull'], {
      cwd: localPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    let stderr = '';
    
    gitProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      stdout += output;
      console.log(`[git pull stdout]: ${output}`);
    });
    
    gitProcess.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      stderr += output;
      console.log(`[git pull stderr]: ${output}`);
    });
    
    gitProcess.on('close', (code: number | null) => {
      if (code === 0) {
        console.log('リポジトリの更新が完了しました。');
        resolve({
          success: true,
          localPath,
          message: stdout.includes('Already up to date')
            ? 'リポジトリは既に最新です。'
            : 'リポジトリの更新が完了しました。',
        });
      } else {
        const errorMessage = stderr || `git pullが終了コード ${code} で失敗しました。`;
        console.error(`リポジトリの更新に失敗しました: ${errorMessage}`);
        resolve({
          success: false,
          localPath,
          message: 'リポジトリの更新に失敗しました。',
          error: errorMessage,
        });
      }
    });
    
    gitProcess.on('error', (error: Error) => {
      console.error(`git pullプロセスでエラーが発生しました: ${error.message}`);
      resolve({
        success: false,
        localPath,
        message: 'git pullプロセスの起動に失敗しました。',
        error: error.message,
      });
    });
  });
};
