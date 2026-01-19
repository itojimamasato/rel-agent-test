import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isRepositoryCloned, getClonePath } from '@/lib/git/clone';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// ステータスレスポンスの型定義
interface StatusResponse {
  projectId: string;
  isCloned: boolean;
  localPath: string;
  message: string;
  error?: string;
}

// GET: リポジトリのクローン状態を確認する
export async function GET(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          projectId: '',
          isCloned: false,
          localPath: '',
          message: '認証が必要です',
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // クエリパラメータからprojectIdを取得
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // バリデーション: projectIdは必須
    if (!projectId) {
      return NextResponse.json(
        {
          projectId: '',
          isCloned: false,
          localPath: '',
          message: 'プロジェクトIDが指定されていません',
          error: 'projectId query parameter is required',
        },
        { status: 400 }
      );
    }

    // プロジェクトの所有権を確認
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        {
          projectId: '',
          isCloned: false,
          localPath: '',
          message: 'プロジェクトが見つかりません',
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    console.log(`リポジトリステータスAPIが呼び出されました: projectId=${projectId}`);

    // クローン状態を確認
    const isCloned = isRepositoryCloned(projectId);
    const localPath = getClonePath(projectId);

    return NextResponse.json(
      {
        projectId,
        isCloned,
        localPath,
        message: isCloned
          ? 'リポジトリはクローン済みです'
          : 'リポジトリはまだクローンされていません',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('リポジトリステータスAPIでエラーが発生しました:', error);

    const errorMessage = error instanceof Error ? error.message : '不明なエラー';

    return NextResponse.json(
      {
        projectId: '',
        isCloned: false,
        localPath: '',
        message: 'サーバーエラーが発生しました',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
