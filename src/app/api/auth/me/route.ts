import { withAuth, withErrorHandler } from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'

export const GET = withAuth(
  withErrorHandler(async (_request, { user }) => {
    return ApiResponse.success({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  })
)
