import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { RepositoryType } from '@/generated/prisma/client'

export const runtime = 'nodejs'

interface ProjectCreateRequest {
  name: string
  description: string
  repositoryType: 'github' | 'backlog'
  repositoryUrl: string
  githubToken?: string
  backlogDomain?: string
  backlogProjectKey?: string
  backlogApiKey?: string
  backlogEmail?: string
  backlogGitPassword?: string
}

interface ProjectUpdateRequest extends ProjectCreateRequest {
  id: string
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('プロジェクト一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as ProjectCreateRequest

    if (!body.name || !body.repositoryType || !body.repositoryUrl) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || '',
        repositoryType: body.repositoryType as RepositoryType,
        repositoryUrl: body.repositoryUrl,
        githubToken: body.githubToken,
        backlogDomain: body.backlogDomain,
        backlogProjectKey: body.backlogProjectKey,
        backlogApiKey: body.backlogApiKey,
        backlogEmail: body.backlogEmail,
        backlogGitPassword: body.backlogGitPassword,
        userId,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('プロジェクト作成エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as ProjectUpdateRequest

    if (!body.id) {
      return NextResponse.json(
        { error: 'プロジェクトIDが必要です' },
        { status: 400 }
      )
    }

    const existingProject = await prisma.project.findFirst({
      where: { id: body.id, userId },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    const project = await prisma.project.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description || '',
        repositoryType: body.repositoryType as RepositoryType,
        repositoryUrl: body.repositoryUrl,
        githubToken: body.githubToken,
        backlogDomain: body.backlogDomain,
        backlogProjectKey: body.backlogProjectKey,
        backlogApiKey: body.backlogApiKey,
        backlogEmail: body.backlogEmail,
        backlogGitPassword: body.backlogGitPassword,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('プロジェクト更新エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'プロジェクトIDが必要です' },
        { status: 400 }
      )
    }

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('プロジェクト削除エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    )
  }
}
