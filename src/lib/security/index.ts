/**
 * Security Module Index
 * Tüm güvenlik fonksiyonlarını export eden ana modül
 */

// Rate limiting
export {
  checkRateLimit,
  checkIPRateLimit,
  checkUserRateLimit,
  getEndpointConfig,
  createRateLimitHeaders,
  withRateLimit,
  getRateLimitStats,
  ENDPOINT_LIMITS,
} from './rate-limit'

// Input sanitization
export {
  containsXSS,
  containsSQLInjection,
  containsNoSQLInjection,
  containsPathTraversal,
  escapeHtml,
  sanitizeInput,
  isValidEmail,
  isValidPhoneNumber,
  isValidTCNumber,
  validateApiInput,
  sanitizeRequestBody,
  sanitizeFilename,
  isValidUUID,
  isValidIP,
  generateSecureString,
} from './input-sanitizer'

// Types
export type {
  RateLimitConfig,
  RateLimitResult,
} from './rate-limit'
