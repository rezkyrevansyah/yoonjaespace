import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()

  // Test 1: Simple query
  const t1 = Date.now()
  await prisma.$queryRaw`SELECT 1`
  const queryTime = Date.now() - t1

  // Test 2: Second query (should be faster if pooling works)
  const t2 = Date.now()
  await prisma.$queryRaw`SELECT 1`
  const queryTime2 = Date.now() - t2

  // Test 3: Simple findFirst
  const t3 = Date.now()
  await prisma.user.findFirst({ select: { id: true } })
  const queryTime3 = Date.now() - t3

  return NextResponse.json({
    totalMs: Date.now() - start,
    firstQueryMs: queryTime,
    secondQueryMs: queryTime2,
    findFirstMs: queryTime3,
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'),
  })
}
