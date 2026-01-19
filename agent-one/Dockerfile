# ベースイメージ
FROM node:20-slim

# git と OpenSSL をインストール（Prisma に必要）
RUN apt-get update && apt-get install -y git openssl && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリ
WORKDIR /app

# Claude Code CLI インストール
RUN npm install -g @anthropic-ai/claude-code

# Claude設定ディレクトリ作成
RUN mkdir -p /root/.claude

# API Key Helper スクリプト作成
RUN echo '#!/bin/bash\necho $ANTHROPIC_API_KEY' > /root/.claude/api_key_helper.sh \
    && chmod +x /root/.claude/api_key_helper.sh

# Claude設定ファイル作成（オンボーディングスキップ）
RUN echo '{"hasCompletedOnboarding": true, "shiftEnterKeyBindingInstalled": true}' > /root/.claude.json

# パッケージファイルをコピー
COPY package*.json ./

# Prisma スキーマと設定をコピー（prisma generate に必要）
COPY prisma ./prisma/
COPY prisma.config.ts ./

# 依存関係インストール（devDependencies を明示的に含める）
RUN npm ci --include=dev --legacy-peer-deps

# Prisma クライアント生成（ビルド時はダミーURLを使用、実際のDB接続は行わない）
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

# ソースコードをコピー
COPY . .

# Next.js ビルド
RUN npm run build

# 本番用に devDependencies を削除（イメージサイズ削減）
RUN npm prune --production --legacy-peer-deps

# ポート公開
EXPOSE 3000

# 起動時にマイグレーション実行してからサーバー起動
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
