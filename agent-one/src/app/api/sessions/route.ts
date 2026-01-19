import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { MessageRole } from '@/generated/prisma/client'

export const runtime = 'nodejs'

interface MessageInput {
  role: 'user' | 'assistant'
  content: string
}

interface SessionCreateRequest {
  projectId: string
  messages: MessageInput[]
}

interface SessionUpdateRequest {
  id: string
  messages: MessageInput[]
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (projectId) {
      const session = await prisma.session.findFirst({
        where: { projectId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      if (!session) {
        return NextResponse.json(null)
      }

      return NextResponse.json({
        id: session.id,
        projectId: session.projectId,
        messages: session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt.toISOString(),
        })),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      })
    }

    const sessions = await prisma.session.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(
      sessions.map((session) => ({
        id: session.id,
        projectId: session.projectId,
        messages: session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt.toISOString(),
        })),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('セッション取得エラー:', error)
    return NextResponse.json(
      { error: 'セッションの取得に失敗しました' },
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

    const body = (await request.json()) as SessionCreateRequest

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'プロジェクトIDが必要です' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findFirst({
      where: { id: body.projectId, userId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    const existingSession = await prisma.session.findFirst({
      where: { projectId: body.projectId, userId },
    })

    if (existingSession) {
      await prisma.message.deleteMany({
        where: { sessionId: existingSession.id },
      })

      if (body.messages && body.messages.length > 0) {
        await prisma.message.createMany({
          data: body.messages.map((m) => ({
            role: m.role as MessageRole,
            content: m.content,
            sessionId: existingSession.id,
          })),
        })
      }

      const updatedSession = await prisma.session.update({
        where: { id: existingSession.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        data: {},
      })

      return NextResponse.json({
        id: updatedSession.id,
        projectId: updatedSession.projectId,
        messages: updatedSession.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt.toISOString(),
        })),
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: updatedSession.updatedAt.toISOString(),
      })
    }

    const session = await prisma.session.create({
      data: {
        projectId: body.projectId,
        userId,
        messages: {
          create:
            body.messages?.map((m) => ({
              role: m.role as MessageRole,
              content: m.content,
            })) || [],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json(
      {
        id: session.id,
        projectId: session.projectId,
        messages: session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt.toISOString(),
        })),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('セッション作成エラー:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
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

    const body = (await request.json()) as SessionUpdateRequest

    if (!body.id) {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      )
    }

    const existingSession = await prisma.session.findFirst({
      where: { id: body.id, userId },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.message.deleteMany({
      where: { sessionId: body.id },
    })

    if (body.messages && body.messages.length > 0) {
      await prisma.message.createMany({
        data: body.messages.map((m) => ({
          role: m.role as MessageRole,
          content: m.content,
          sessionId: body.id,
        })),
      })
    }

    const session = await prisma.session.update({
      where: { id: body.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      data: {},
    })

    return NextResponse.json({
      id: session.id,
      projectId: session.projectId,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('セッション更新エラー:', error)
    return NextResponse.json(
      { error: 'セッションの更新に失敗しました' },
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
    const sessionId = searchParams.get('id')
    const projectId = searchParams.get('projectId')

    if (sessionId) {
      const existingSession = await prisma.session.findFirst({
        where: { id: sessionId, userId },
      })

      if (!existingSession) {
        return NextResponse.json(
          { error: 'セッションが見つかりません' },
          { status: 404 }
        )
      }

      await prisma.session.delete({
        where: { id: sessionId },
      })

      return NextResponse.json({ success: true })
    }

    if (projectId) {
      await prisma.session.deleteMany({
        where: { projectId, userId },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'セッションIDまたはプロジェクトIDが必要です' },
      { status: 400 }
    )
  } catch (error) {
    console.error('セッション削除エラー:', error)
    return NextResponse.json(
      { error: 'セッションの削除に失敗しました' },
      { status: 500 }
    )
  }
}
