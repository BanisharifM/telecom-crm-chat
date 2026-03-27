import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/conversations - list user's conversations
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      pinned: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(conversations)
}

// POST /api/conversations - create a new conversation
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const title = body.title || 'New Chat'

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title,
    },
  })

  return NextResponse.json(conversation, { status: 201 })
}
