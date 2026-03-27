import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/conversations/[id]/messages - get messages for a conversation
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns this conversation
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(messages)
}

// POST /api/conversations/[id]/messages - save a message
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns this conversation
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      role: body.role,
      content: body.content,
      sqlQuery: body.sqlQuery || null,
      chartType: body.chartType || null,
      chartConfig: body.chartConfig || null,
      dataColumns: body.dataColumns || null,
      dataRows: body.dataRows || null,
      queryTimeMs: body.queryTimeMs || null,
      rowsReturned: body.rowsReturned || null,
    },
  })

  // Update conversation title from first user message (auto-title)
  if (body.role === 'user') {
    const messageCount = await prisma.message.count({
      where: { conversationId: params.id },
    })
    if (messageCount <= 1) {
      // First message - use it as the title (truncated)
      const title = body.content.length > 50
        ? body.content.substring(0, 50) + '...'
        : body.content
      await prisma.conversation.update({
        where: { id: params.id },
        data: { title, updatedAt: new Date() },
      })
    } else {
      // Update timestamp
      await prisma.conversation.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      })
    }
  }

  return NextResponse.json(message, { status: 201 })
}
