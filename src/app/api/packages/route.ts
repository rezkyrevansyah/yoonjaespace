import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  withAuth,
  withAdmin,
  withErrorHandler,
  validateRequest,
} from '@/lib/api-middleware'
import { ApiResponse } from '@/lib/api-response'
import { createPackageSchema, packageQuerySchema } from '@/schemas'
import { apiLogger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

// GET — List packages
export const GET = withAuth(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate query parameters
    const validation = await validateRequest(request, packageQuerySchema, 'query')
    if (!validation.success) return validation.error

    const { isActive } = validation.data

    // Build where clause
    const where: Prisma.PackageWhereInput = {}
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Fetch packages
    const packages = await prisma.package.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    apiLogger.info({
      msg: 'Packages fetched',
      userId: user.id,
      count: packages.length,
    })

    return ApiResponse.success(packages)
  })
)

// POST — Create package
export const POST = withAdmin(
  withErrorHandler(async (request: NextRequest, { user }) => {
    // Validate request body
    const validation = await validateRequest(request, createPackageSchema, 'body')
    if (!validation.success) return validation.error

    const { name, description, price, duration, maxPeople, isActive } = validation.data

    // Create package
    const pkg = await prisma.package.create({
      data: {
        name,
        description: description || null,
        price,
        duration,
        maxPeople,
        isActive,
      },
    })

    apiLogger.info({
      msg: 'Package created',
      packageId: pkg.id,
      createdBy: user.id,
    })

    return ApiResponse.created(pkg)
  })
)
