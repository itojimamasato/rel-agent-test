# AGENT-One 要件定義書

**バージョン**: 1.2  
**作成日**: 2025年1月  
**更新日**: 2025年1月  
**ステータス**: MVP開発中

---

## 1. 概要

### 1.1 コンセプト

AGENT-Oneは、**アプリ保守に特化したAIエージェント**である。利用者は営業担当やエンジニアで、既存アプリケーションについての様々な調査をAIに依頼できる。

### 1.2 解決する課題

| 課題 | AGENT-Oneによる解決 |
|------|---------------------|
| ソースコード理解に時間がかかる | AIがコードを解析し、機能の使い方を説明 |
| 工数見積りの属人化 | AIが作業分解と工数算出を支援 |
| バグ調査の効率化 | GitHub/Backlog IssueとコードをAIが横断的に調査 |

### 1.3 対象ユーザー

- 営業担当：顧客への見積り提示時に利用
- エンジニア：保守作業の調査・見積りに利用

---

## 2. ユースケース

### 2.1 既存アプリケーション利用方法調査

**概要**: チャット画面で機能の利用方法を質問すると、ソースコードを解析して使い方を説明する。

**フロー**:
```
1. ユーザーがプロジェクトを選択
2. 「このアプリケーションの〇〇機能の利用方法を教えて」と入力
3. AIがGitHub/Backlog経由でソースコードを取得
4. AIがコードを解析し、利用方法を回答
```

**入力例**:
> このアプリケーションの検索機能の利用方法を教えて

**出力例**:
> 検索機能は以下の手順で利用できます：
> 1. ヘッダーの検索アイコンをクリック
> 2. キーワードを入力してEnter
> 3. 結果一覧から該当項目を選択
> 
> 技術的には `SearchController.java` の `search()` メソッドが...

---

### 2.2 機能追加の工数見積り

**概要**: 機能追加の依頼に対し、必要な作業内容と工数を見積もる。

**フロー**:
```
1. ユーザーがプロジェクトを選択
2. 「〇〇機能を追加する場合の工数を見積もって」と入力
3. AIがソースコードを解析
4. AIが作業内容一覧と各工数を回答
```

**入力例**:
> このアプリケーションにCSVエクスポート機能を追加する場合、必要な対応とどれくらいの工数がかかるのか見積もって

**出力例**:
> ## 作業内容と工数見積り
> 
> | 作業項目 | 工数 | 備考 |
> |---------|------|------|
> | API設計・実装 | 4h | ExportController新規作成 |
> | CSV生成ロジック | 3h | Apache Commons CSV利用 |
> | UI実装（ボタン追加） | 2h | 一覧画面に追加 |
> | 単体テスト | 2h | - |
> | 結合テスト | 1h | - |
> | **合計** | **12h** | |

---

### 2.3 バグ調査

**概要**: GitHub IssueまたはBacklog課題を指定し、バグ修正に必要な対応内容と工数を見積もる。

**フロー**:
```
1. ユーザーがプロジェクトを選択
2. 「Issue #123 のバグ修正に必要な対応と工数を見積もって」と入力
   または「課題 PROJECT-123 のバグ修正に必要な対応と工数を見積もって」と入力
3. AIがIssue/課題内容を取得
4. AIが関連コードを解析
5. AIが修正方針と工数を回答
```

**入力例（GitHub）**:
> Issue #45 のバグ修正に必要な対応内容と工数を見積って

**入力例（Backlog）**:
> 課題 MYAPP-123 のバグ修正に必要な対応内容と工数を見積って

**出力例**:
> ## Issue #45: ログイン時にエラーが発生する
> 
> ### 原因分析
> `AuthService.java` の `authenticate()` メソッドで、null チェックが不足しています。
> 
> ### 修正内容と工数
> | 作業項目 | 工数 | 備考 |
> |---------|------|------|
> | 原因調査（完了） | - | 上記の通り |
> | コード修正 | 1h | null チェック追加 |
> | 単体テスト追加 | 1h | 境界値テスト |
> | **合計** | **2h** | |

---

## 3. 機能要件（MVP）

### 3.1 プロジェクト管理機能

| 機能 | 説明 |
|------|------|
| プロジェクト作成 | 名前、説明、リポジトリタイプ、リポジトリURL、認証情報を登録 |
| プロジェクト一覧 | 登録済みプロジェクトを一覧表示 |
| プロジェクト編集 | 登録情報の変更 |
| プロジェクト削除 | プロジェクトと関連データの削除 |
| プロジェクト切り替え | チャット対象のプロジェクトを選択 |

**プロジェクト情報**:
```typescript
// リポジトリタイプの定義
type RepositoryType = 'github' | 'backlog';

interface Project {
  id: string;
  name: string;              // プロジェクト名
  description: string;       // 説明
  repositoryType: RepositoryType;  // リポジトリタイプ
  repositoryUrl: string;     // リポジトリURL
  
  // GitHub用認証情報
  githubToken?: string;      // Personal Access Token
  
  // Backlog用認証情報
  backlogDomain?: string;       // Backlogドメイン（例: xxx.backlog.com）
  backlogApiKey?: string;       // Backlog APIキー（課題取得用）
  backlogProjectKey?: string;   // Backlogプロジェクトキー
  backlogEmail?: string;        // Git認証用メールアドレス
  backlogGitPassword?: string;  // Git認証用パスワード
  
  createdAt: string;
  updatedAt: string;
}
```

**リポジトリタイプ別の必須項目**:

| 項目 | GitHub | Backlog |
|------|--------|---------|
| repositoryUrl | ✅ 必須 | ✅ 必須 |
| githubToken | ✅ 必須（プライベートリポジトリ） | - |
| backlogDomain | - | ✅ 必須 |
| backlogApiKey | - | ✅ 必須（課題取得用） |
| backlogProjectKey | - | ✅ 必須 |
| backlogEmail | - | ✅ 必須（Git認証用） |
| backlogGitPassword | - | ✅ 必須（Git認証用） |

---

### 3.2 AIチャット機能

| 機能 | 説明 |
|------|------|
| メッセージ送信 | ユーザーがAIに質問・依頼を送信 |
| AI応答表示 | AIの回答をリアルタイム表示 |
| 会話履歴表示 | 現在のセッションの会話履歴を表示 |
| Markdown対応 | AI応答のMarkdownをレンダリング |

**チャットメッセージ**:
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}
```

---

### 3.3 外部リポジトリ連携機能（MCP）

#### 3.3.1 概要

外部のGitリポジトリサービスと連携し、ソースコードの取得およびIssue/課題の取得を行う。
MVPではGitHubとBacklogに対応する。

#### 3.3.2 対応サービス比較

| 機能 | GitHub | Backlog |
|------|--------|---------|
| MCPサーバー | GitHub MCP Server | Backlog MCP Server（Nulab公式） |
| 認証方式（API） | Personal Access Token | APIキー |
| 認証方式（Git） | Personal Access Token | メールアドレス + Gitパスワード |
| リポジトリ一覧取得 | ✅ | ✅ |
| ファイル内容取得 | ✅（API経由） | ✅（git clone経由） |
| Issue/課題取得 | ✅ | ✅ |
| プルリクエスト取得 | ✅ | ✅ |

#### 3.3.3 GitHub連携

| 機能 | 説明 |
|------|------|
| リポジトリ接続 | Personal Access Tokenで認証 |
| コード取得 | MCP経由でファイル内容を直接取得 |
| Issue取得 | Issue一覧・詳細を取得 |

**認証方式**: Personal Access Token（PAT）
- ユーザーがGitHubで発行したトークンをプロジェクト設定で入力
- 必要なスコープ: `repo`（プライベートリポジトリの場合）

#### 3.3.4 Backlog連携

| 機能 | 説明 |
|------|------|
| リポジトリ接続 | メールアドレス + Gitパスワードで認証 |
| コード取得 | git clone経由でリポジトリをクローン後、ファイル内容を取得 |
| 課題取得 | APIキー認証でMCP経由で取得 |

**認証方式**:

| 用途 | 認証情報 |
|------|----------|
| Git操作（clone/pull） | メールアドレス + Gitパスワード |
| API操作（課題取得等） | APIキー |

**重要**: Backlog GitのHTTPS認証には**APIキーは使用できません**。専用の「Gitパスワード」が必要です。

**Backlog MCP Server提供ツール（主要なもの）**:

| ツール名 | 説明 |
|----------|------|
| get_space | Backlogスペース情報を取得 |
| get_projects | プロジェクト一覧を取得 |
| get_project | プロジェクト詳細を取得 |
| get_issues | 課題一覧を取得 |
| get_issue | 課題詳細を取得 |
| get_git_repositories | Gitリポジトリ一覧を取得 |
| get_git_repository | Gitリポジトリ詳細を取得 |
| get_pull_requests | プルリクエスト一覧を取得 |
| get_pull_request | プルリクエスト詳細を取得 |

#### 3.3.5 ソースコード取得方式の違い

| 方式 | GitHub | Backlog |
|------|--------|---------|
| 取得方法 | MCP経由でファイル内容を直接取得 | git clone後にローカルファイルを読み取り |
| 初回アクセス | 即時 | クローン時間が必要 |
| 更新時 | 都度API呼び出し | git pull |
| キャッシュ | MCP側で管理 | ローカルリポジトリとして保持 |

**Backlogのソースコード取得フロー**:
```
1. プロジェクト選択時にBacklogリポジトリ情報を取得
2. リポジトリURLを使用してgit clone実行（HTTPS認証）
3. クローンしたローカルリポジトリからファイル内容を読み取り
4. AIがローカルファイルを解析
```

---

## 4. 非機能要件

### 4.1 性能要件

| 項目 | 要件 |
|------|------|
| 応答時間 | AI応答開始まで5秒以内（ストリーミング） |
| 同時接続 | MVP: 単一ユーザー想定 |
| リポジトリクローン | 初回クローン時は規模に応じた待機時間を許容 |

### 4.2 セキュリティ要件

| 項目 | MVP対応 | 将来対応 |
|------|---------|----------|
| ユーザー認証 | なし | Clerk導入 |
| APIキー管理 | localStorage | 暗号化 or Secrets Manager |
| 通信暗号化 | HTTPS | HTTPS |
| クローンリポジトリ | 一時ディレクトリに保存、セッション終了時に削除 | 暗号化ストレージ |

### 4.3 運用要件

| 項目 | 要件 |
|------|------|
| デプロイ先 | Railway |
| 監視 | Railway標準ログ |
| バックアップ | なし（localStorage利用のため） |
| ディスク管理 | クローンリポジトリの定期クリーンアップ |

---

## 5. 技術仕様

### 5.1 技術スタック

| 項目 | 技術 | バージョン |
|------|------|-----------|
| ランタイム | Node.js | v20 LTS |
| フレームワーク | Next.js (App Router) | v15 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | v4 |
| 状態管理 | React hooks + Context | - |
| AI実行 | Claude Code CLI | 最新 |
| GitHub連携 | GitHub MCP Server | - |
| Backlog連携 | Backlog MCP Server (Nulab公式) | 最新 |

### 5.2 アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Next.js Application                    │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │   Frontend      │  │        Backend              │ │  │
│  │  │   (React)       │  │     (API Routes)            │ │  │
│  │  │                 │  │           │                 │ │  │
│  │  │  チャットUI     │◄─┤  POST /api/chat             │ │  │
│  │  │  プロジェクト管理│  │           │                 │ │  │
│  │  └─────────────────┘  │           ▼                 │ │  │
│  │                       │  ┌───────────────────┐      │ │  │
│  │                       │  │   Claude Code     │      │ │  │
│  │                       │  │   (Headless)      │      │ │  │
│  │                       │  └─────────┬─────────┘      │ │  │
│  │                       └────────────┼────────────────┘ │  │
│  └────────────────────────────────────┼──────────────────┘  │
└────────────────────────────────────────┼────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
         │     GitHub      │  │     Backlog     │  │   ローカル      │
         │  (MCP Server)   │  │  (MCP Server)   │  │  リポジトリ     │
         │  - リポジトリ   │  │  - 課題         │  │  (git clone)    │
         │  - Issue        │  │  - リポジトリ   │  │                 │
         └─────────────────┘  │    メタデータ   │  └─────────────────┘
                              └─────────────────┘
```

### 5.3 ディレクトリ構成

```
agent-one/
├── src/
│   ├── app/
│   │   ├── page.tsx              # メインページ（チャットUI）
│   │   ├── layout.tsx            # 共通レイアウト
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts      # Chat API エンドポイント
│   │       └── repo/
│   │           ├── clone/
│   │           │   └── route.ts  # Clone API エンドポイント
│   │           └── status/
│   │               └── route.ts  # Status API エンドポイント
│   ├── components/
│   │   ├── ChatInput.tsx         # メッセージ入力
│   │   ├── ChatArea.tsx          # チャットエリア
│   │   ├── MessageBubble.tsx     # メッセージ表示
│   │   ├── ProjectList.tsx       # プロジェクト一覧
│   │   └── ProjectModal.tsx      # プロジェクト作成/編集
│   ├── lib/
│   │   ├── storage.ts            # localStorage操作
│   │   ├── claude.ts             # Claude Code連携
│   │   ├── mcp/
│   │   │   ├── github.ts         # GitHub MCP設定
│   │   │   └── backlog.ts        # Backlog MCP設定
│   │   └── git/
│   │       └── clone.ts          # git clone操作
│   └── types/
│       └── index.ts              # 型定義
├── repos/                        # クローンしたリポジトリの一時保存先
│   └── .gitkeep
├── docs/
│   └── REQUIREMENTS.md           # 本ドキュメント
└── package.json
```

---

## 6. 画面設計

### 6.1 画面構成

```
┌─────────────────────────────────────────────────────────┐
│  AGENT-One                      [プロジェクト選択 ▼]    │
├─────────────┬───────────────────────────────────────────┤
│             │                                           │
│ プロジェクト │            チャットエリア                 │
│ 一覧        │                                           │
│             │  ┌─────────────────────────────────────┐  │
│ ─────────── │  │ 👤 このアプリの検索機能の            │  │
│ 🐙 Project A│  │    使い方を教えて                    │  │
│ 📋 Project B│  ├─────────────────────────────────────┤  │
│             │  │ 🤖 検索機能について解析しました...   │  │
│ [+ 新規]    │  │                                     │  │
│             │  └─────────────────────────────────────┘  │
│             │                                           │
│ 凡例:       │  ┌─────────────────────────────────────┐  │
│ 🐙 GitHub   │  │ メッセージを入力...          [送信] │  │
│ 📋 Backlog  │  └─────────────────────────────────────┘  │
└─────────────┴───────────────────────────────────────────┘
```

### 6.2 画面一覧

| 画面 | 機能 |
|------|------|
| メイン画面 | プロジェクト一覧 + チャット |
| プロジェクト作成モーダル | 新規プロジェクト登録（GitHub/Backlog選択） |
| プロジェクト編集モーダル | プロジェクト情報変更 |
| 設定モーダル（将来） | 認証情報設定等 |

### 6.3 プロジェクト作成モーダル（Backlog選択時）

```
┌─────────────────────────────────────────────────────────┐
│  新規プロジェクト作成                              [×]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  プロジェクト名 *                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ My App                                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  説明                                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 顧客管理システムの保守プロジェクト              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  リポジトリタイプ *                                     │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ ○ GitHub    │  │ ● Backlog   │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
│  ─────────── Backlog設定 ───────────                   │
│                                                         │
│  Backlogドメイン *                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ mycompany.backlog.com                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  プロジェクトキー *                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ MYAPP                                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  リポジトリURL *                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ https://mycompany.backlog.com/git/MYAPP/app.git │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────── API認証（課題取得用） ───────────         │
│                                                         │
│  APIキー *                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ****************************************        │   │
│  └─────────────────────────────────────────────────┘   │
│  ※ 個人設定 > API で発行                               │
│                                                         │
│  ─────────── Git認証（ソースコード取得用） ───────     │
│                                                         │
│  メールアドレス *                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ user@example.com                                │   │
│  └─────────────────────────────────────────────────┘   │
│  ※ ヌーラボアカウントのメールアドレス                  │
│                                                         │
│  Gitパスワード *                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ****************************************        │   │
│  └─────────────────────────────────────────────────┘   │
│  ※ 個人設定 > パスワード で作成（APIキーとは別）       │
│                                                         │
│                              [キャンセル] [作成]        │
└─────────────────────────────────────────────────────────┘
```

---

## 7. データ設計

### 7.1 データ保存先

| データ | 保存先 | 備考 |
|--------|--------|------|
| プロジェクト情報 | localStorage | `agent-one-projects` |
| 現在のプロジェクトID | localStorage | `agent-one-current-project` |
| チャットセッション | localStorage | `agent-one-sessions` |
| クローンリポジトリ | ファイルシステム | `repos/` ディレクトリ |

### 7.2 データ構造

```typescript
// localStorage: agent-one-projects
Project[]

// localStorage: agent-one-current-project
string (projectId)

// localStorage: agent-one-sessions
ChatSession[]

// ファイルシステム: repos/
// repos/{projectId}/ - 各プロジェクトのクローンリポジトリ
```

---

## 8. API設計

### 8.1 エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/chat` | AIにメッセージを送信 |
| POST | `/api/repo/clone` | リポジトリをクローン（Backlog用） |
| GET | `/api/repo/status` | クローン状態を確認 |

### 8.2 POST /api/chat

**リクエスト**:
```typescript
interface ChatRequest {
  message: string;      // ユーザーのメッセージ
  projectId: string;    // 対象プロジェクトID
  sessionId?: string;   // 会話継続時のセッションID
}
```

**レスポンス**:
```typescript
interface ChatResponse {
  message: string;      // AIの応答
  sessionId: string;    // セッションID
  error?: string;       // エラーメッセージ
}
```

### 8.3 POST /api/repo/clone

**リクエスト**:
```typescript
interface CloneRequest {
  projectId: string;      // プロジェクトID
  repositoryUrl: string;  // リポジトリURL
  username?: string;      // Git認証用ユーザー名（メールアドレス）
  password?: string;      // Git認証用パスワード
}
```

**レスポンス**:
```typescript
interface CloneResponse {
  success: boolean;
  localPath?: string;   // クローン先パス
  message: string;
  error?: string;
}
```

### 8.4 GET /api/repo/status

**リクエスト**:
```typescript
// Query parameters
interface StatusQuery {
  projectId: string;
}
```

**レスポンス**:
```typescript
interface StatusResponse {
  exists: boolean;      // クローン済みかどうか
  localPath?: string;   // ローカルパス
  lastUpdated?: string; // 最終更新日時
}
```

---

## 9. 将来拡張

### 9.1 Phase 2（認証追加）

- Clerk による認証機能
- ユーザーごとのプロジェクト管理
- データベース導入（PostgreSQL等）

### 9.2 Phase 3（機能拡張）

- GitLab対応
- Bitbucket対応
- チャット履歴の永続化・検索
- レポート出力機能（PDF/Excel）
- チーム共有機能

---

## 10. 用語集

| 用語 | 説明 |
|------|------|
| MCP | Model Context Protocol。AIとツールを接続するプロトコル |
| Claude Code | Anthropic社のAIコーディングツール |
| PAT | Personal Access Token。GitHub APIの認証トークン |
| Railway | PaaSサービス。アプリのホスティング先 |
| Backlog | Nulab社が提供するプロジェクト管理ツール。Git機能を内蔵 |
| APIキー | Backlog APIにアクセスするための認証キー |
| プロジェクトキー | Backlogプロジェクトを識別する一意のキー（例: MYAPP） |
| Gitパスワード | Backlog GitのHTTPS認証用に発行する専用パスワード |

---

## 改訂履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025年1月 | 1.0 | 初版作成 |
| 2025年1月 | 1.1 | Backlog Git対応を追加（MVP範囲） |
| 2025年1月 | 1.2 | Backlog認証情報の取得方法を追記、Project型を更新 |

---

## 付録A: Backlog認証情報の取得方法

Backlog連携には**2種類の認証情報**が必要です。用途が異なるため、それぞれ別々に取得する必要があります。

### A.1 認証情報の種類と用途

| 認証情報 | 用途 | 取得場所 |
|----------|------|----------|
| APIキー | 課題取得、プロジェクト情報取得 | 個人設定 > API |
| Gitパスワード | git clone、git pull | 個人設定 > パスワード |
| メールアドレス | Git認証のユーザー名 | ヌーラボアカウントのメールアドレス |

**重要**: APIキーではGit操作（clone/pull）はできません。必ずGitパスワードを使用してください。

---

### A.2 Backlogドメイン

**概要**: BacklogスペースのURLのドメイン部分

**確認方法**:
1. Backlogにログイン
2. ブラウザのアドレスバーを確認
3. URLの形式から取得

**例**:
| URL | backlogDomain |
|-----|---------------|
| `https://mycompany.backlog.com/` | `mycompany.backlog.com` |
| `https://mycompany.backlog.jp/` | `mycompany.backlog.jp` |

---

### A.3 APIキーの取得手順

**用途**: Backlog API（課題取得、プロジェクト情報取得等）

**取得手順**:

```
1. Backlogにログイン

2. 右上のユーザーアイコンをクリック

3. 「個人設定」を選択

4. 左メニューから「API」をクリック

5. 「メモ」欄に用途を入力（例：「AGENT-One連携用」）

6. 「登録」ボタンをクリック

7. 発行されたAPIキー文字列をコピーして保存
```

**画面遷移**:
```
右上アイコン → 個人設定 → API → メモ入力 → 登録
```

**注意事項**:
- APIキーは発行したユーザーと同じ権限を持つ
- 目的ごとに別のAPIキーを発行することを推奨
- 不要になったAPIキーは削除する

---

### A.4 Gitパスワードの取得手順

**用途**: Git操作（clone、pull、push等）のHTTPS認証

**取得手順**:

```
1. Backlogにログイン

2. 右上のユーザーアイコンをクリック

3. 「個人設定」を選択

4. 左メニューから「パスワード」をクリック

5. 「パスワードを作成」ボタンをクリック

6. 作成されたパスワードをコピーして保存
```

**画面遷移**:
```
右上アイコン → 個人設定 → パスワード → パスワードを作成
```

**重要**:
- このパスワードは**APIキーとは別物**です
- Git操作専用のパスワードとして使用します
- 2段階認証を設定している場合は必須です

---

### A.5 メールアドレス（Git認証用ユーザー名）

**用途**: Git認証時のユーザー名として使用

**確認方法**:

ヌーラボアカウントでログインしている場合：
- **ヌーラボアカウントのメールアドレス**を使用

Backlogアカウントでログインしている場合：
- **BacklogのユーザーID**を使用

**確認場所**:
```
右上アイコン → 個人設定 → ユーザー情報
```

---

### A.6 プロジェクトキー

**概要**: Backlogプロジェクトを識別する一意のキー

**確認方法**:

#### 方法1: 課題キーから確認
課題の一覧や詳細画面で表示される課題キーの**ハイフン前の部分**がプロジェクトキー

```
課題キー: MYAPP-123
         ↓
プロジェクトキー: MYAPP
```

#### 方法2: プロジェクト設定URLから確認
```
URL例: https://mycompany.backlog.com/projects/MYAPP
                                          ↑
                              プロジェクトキー: MYAPP
```

---

### A.7 リポジトリURL

**概要**: git clone時に使用するHTTPS URL

**確認方法**:

```
1. Backlogにログイン

2. 対象プロジェクトを開く

3. 「Git」メニューをクリック

4. 対象リポジトリを選択

5. 「HTTPS」タブを選択

6. 表示されたURLをコピー
```

**URL形式**:
```
https://{domain}/git/{projectKey}/{repositoryName}.git

例: https://mycompany.backlog.com/git/MYAPP/backend.git
```

---

### A.8 設定値まとめ

```typescript
// Backlogプロジェクトの設定例
const backlogConfig = {
  backlogDomain: "mycompany.backlog.com",           // ① スペースURL
  backlogProjectKey: "MYAPP",                       // ② プロジェクトキー
  repositoryUrl: "https://mycompany.backlog.com/git/MYAPP/backend.git", // ③ リポジトリURL
  backlogApiKey: "AbCdEfGhIjKlMnOpQrStUvWxYz...",  // ④ 個人設定 > API
  backlogEmail: "user@example.com",                 // ⑤ ヌーラボアカウントのメールアドレス
  backlogGitPassword: "XyZ123AbC456DeF789..."       // ⑥ 個人設定 > パスワード
};
```

---

### A.9 トラブルシューティング

| エラー | 原因 | 対処法 |
|--------|------|--------|
| `remote: Unauthorized` | 認証情報が正しくない | メールアドレスとGitパスワードを再確認 |
| `Authentication failed` | APIキーをGit認証に使用している | Gitパスワードを使用する |
| 課題が取得できない | APIキーが無効または権限不足 | APIキーを再発行、プロジェクトメンバー確認 |

---

## 付録B: Backlog MCP Server設定例

### Docker実行

```json
{
  "mcpServers": {
    "backlog": {
      "command": "docker",
      "args": [
        "run",
        "--pull", "always",
        "-i",
        "--rm",
        "-e", "BACKLOG_DOMAIN",
        "-e", "BACKLOG_API_KEY"
      ],
      "env": {
        "BACKLOG_DOMAIN": "your-domain.backlog.com",
        "BACKLOG_API_KEY": "your-api-key"
      }
    }
  }
}
```

### npx実行

```json
{
  "mcpServers": {
    "backlog": {
      "command": "npx",
      "args": ["backlog-mcp-server"],
      "env": {
        "BACKLOG_DOMAIN": "your-domain.backlog.com",
        "BACKLOG_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 利用可能なツールセット

| ツールセット | 説明 |
|-------------|------|
| space | スペース設定・一般情報 |
| project | プロジェクト管理 |
| issue | 課題追跡・コメント |
| wiki | Wikiページ管理 |
| git | Gitリポジトリ・プルリクエスト |
| notifications | ユーザー通知 |
| document | ドキュメント管理 |

AGENT-Oneで使用するツールセット: `project,issue,git`

```bash
# 必要なツールセットのみ有効化
ENABLE_TOOLSETS="project,issue,git"
```

---

## 付録C: v1.1からの主な変更点

### 変更されたデータ構造

**Project型の変更**:
```typescript
// v1.1
interface Project {
  backlogDomain?: string;
  backlogApiKey?: string;
  backlogProjectKey?: string;
}

// v1.2（追加フィールド）
interface Project {
  backlogDomain?: string;
  backlogApiKey?: string;        // 課題取得用
  backlogProjectKey?: string;
  backlogEmail?: string;         // Git認証用メールアドレス（追加）
  backlogGitPassword?: string;   // Git認証用パスワード（追加）
}
```

### 追加されたドキュメント

- 付録A: Backlog認証情報の取得方法（新規追加）
- APIキーとGitパスワードの違いを明確化
- 各認証情報の取得手順を図解
