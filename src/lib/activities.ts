import { prisma } from '@/lib/prisma'

interface LogActivityParams {
  userId: string
  action: string
  details?: string
  type?: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM'
}

/**
 * Helper to record user activities into the database cleanly without crashing requests.
 */
export async function logActivity({ userId, action, details, type }: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details || null,
        type: type || 'SYSTEM',
      },
    })
  } catch (error) {
    console.error('[logActivity Error]:', error)
  }
}
