import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cloneRepository, CloneOptions } from '@/lib/git/clone';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// クローンリクエストの型定義
interface CloneRequest {
  projectId: string;
}

// クローンレスポンスの型定義
interface CloneResponse {
  success: boolean;
  localPath: string;
  message: string;
  error?: string;
}

// POST: リポジトリをクローンする
export async function POST(request: NextRequest): Promise<NextResponse<CloneResponse>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          localPath: '',
          message: '認証が必要です',
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CloneRequest;

    // バリデーション: projectIdは必須
    if (!body.projectId) {
      return NextResponse.json(
        {
          success: false,
          localPath: '',
          message: 'プロジェクトIDが指定されていません',
          error: 'projectId is required',
        },
        { status: 400 }
      );
    }

    // DBからプロジェクト情報を取得
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          localPath: '',
          message: 'プロジェクトが見つかりません',
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // クローンオプションを構築（DBから取得した情報を使用）
    const options: CloneOptions = {
      projectId: project.id,
      repositoryUrl: project.repositoryUrl,
      backlogEmail: project.backlogEmail || undefined,
      backlogGitPassword: project.backlogGitPassword || undefined,
    };

    console.log(`リポジトリクローンAPIが呼び出されました: projectId=${body.projectId}`);

    // クローン処理を実行
    const result = await cloneRepository(options);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          localPath: result.localPath,
          message: result.message,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          localPath: result.localPath,
          message: result.message,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('リポジトリクローンAPIでエラーが発生しました:', error);

    const errorMessage = error instanceof Error ? error.message : '不明なエラー';

    return NextResponse.json(
      {
        success: false,
        localPath: '',
        message: 'サーバーエラーが発生しました',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
