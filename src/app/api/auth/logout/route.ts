import { createClient } from '@/utils/supabase/server'
import { withErrorHandler } from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { authLogger } from '@/lib/logger'

export const POST = withErrorHandler(async () => {
  const supabase = await createClient()

  // Get user before logout for logging
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.auth.signOut()

  if (user) {
    authLogger.info({
      msg: 'User logged out',
      userId: user.id,
    })
  }

  return ApiResponse.success({ success: true })
})
