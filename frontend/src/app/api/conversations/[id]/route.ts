import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/conversations/[id] - rename or pin/unpin
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.pinned !== undefined && { pinned: body.pinned }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/conversations/[id] - delete conversation and all messages
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.conversation.delete({ where: { id: params.id } })

  return NextResponse.json({ deleted: true })
}
