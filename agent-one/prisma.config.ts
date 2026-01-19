import { defineConfig } from "prisma/config";

// ビルド時（prisma generate）はダミーURLを使用
// 実行時（マイグレーション・クエリ）はRailwayから注入されたURLを使用
const databaseUrl = process.env.DATABASE_URL || "postgresql://build:build@localhost:5432/build";


export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
