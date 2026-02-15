/**
 * API Middleware
 *
 * Central export point for all API middleware
 */

// Auth middleware
export {
  withAuth,
  withOwner,
  withAdmin,
  withPhotographer,
  withAnyUser,
  type AuthContext,
  type AuthenticatedUser,
} from './auth.middleware'

// Validation middleware
export {
  validateRequest,
  validateParams,
  validatePagination,
  getSkip,
  type ValidationResult,
  type ValidationSource,
} from './validation.middleware'

// Error middleware
export {
  withErrorHandler,
  handleApiError,
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './error.middleware'

// Logging middleware
export { logRequest, withLogging } from './logging.middleware'
