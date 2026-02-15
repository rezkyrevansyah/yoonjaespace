import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { withErrorHandler, validateRequest } from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { loginSchema } from '@/schemas'
import { authLogger } from '@/lib/logger'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Validate request body
  const validation = await validateRequest(request, loginSchema, 'body')
  if (!validation.success) return validation.error

  const { email, password } = validation.data

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    authLogger.warn({
      msg: 'Login failed',
      email,
      error: error.message,
    })
    return ApiResponse.unauthorized('Email atau password salah')
  }

  authLogger.info({
    msg: 'User logged in',
    userId: data.user.id,
    email: data.user.email,
  })

  return ApiResponse.success({ user: data.user })
})
