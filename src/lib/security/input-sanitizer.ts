/**
 * Input Sanitization ve Validation Utilities
 * XSS, SQL Injection, NoSQL Injection koruması
 */

import { logStructured } from '@/lib/monitoring'

// XSS pattern'leri - Her test() çağrısında yeni regex oluştur (global flag sorunu önlemek için)
function getXSSPatterns(): RegExp[] {
  return [
    /<script[^>]*>.*?<\/script>/i,
    /<script[^\u003e]*\/?>/i,           // <script src="..."> veya <script>
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /expression\(/i,
  ]
}

// SQL Injection pattern'leri
function getSQLPatterns(): RegExp[] {
  return [
    // Sadece kontekst içindeki tek tırnak (örn: ' OR '1'='1)
    /'\s*OR\s*'/i,
    /'\s*AND\s*'/i,
    /'\s*=\s*'/i,
    // Comment injection
    /--/i,
    /\/\*/i,
    // Union injection
    /UNION\s+SELECT/i,
    /UNION\s+ALL\s+SELECT/i,
    // Dangerous keywords with context
    /';\s*EXEC/i,
    /';\s*INSERT/i,
    /';\s*DELETE/i,
    /';\s*DROP/i,
    /EXEC\s*\(/i,
    /xp_cmdshell/i,
    // URL encoded
    /(%27)|(%2D%2D)|(%23)/i,
  ]
}

// NoSQL Injection pattern'leri
function getNoSQLPatterns(): RegExp[] {
  return [
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$gte/i,
    /\$lt/i,
    /\$lte/i,
    /\$regex/i,
    /\$exists/i,
    /\$eq/i,
    /\{[^}]*\$[^}]*\}/i,
  ]
}

// Path traversal pattern'leri - Her test() çağrısında yeni regex oluştur
function getPathTraversalPatterns(): RegExp[] {
  return [
    /\.\.(\\|\/)/i,
    /%2e%2e(\\|\/|%2f)/i,
    /%252e%252e/i,
    /\.\.\/\.\.\/\.\.\//i,
    /\.{2,}\/{2,}/i,
  ]
}

export interface ValidationResult {
  valid: boolean
  sanitized?: string
  error?: string
  field?: string
}

export function containsXSS(input: string): boolean {
  return getXSSPatterns().some(pattern => pattern.test(input))
}

export function containsSQLInjection(input: string): boolean {
  return getSQLPatterns().some(pattern => pattern.test(input))
}

export function containsNoSQLInjection(input: string | object): boolean {
  if (typeof input === 'string') {
    return getNoSQLPatterns().some(pattern => pattern.test(input))
  }
  const jsonString = JSON.stringify(input)
  return getNoSQLPatterns().some(pattern => pattern.test(jsonString))
}

export function containsPathTraversal(input: string): boolean {
  return getPathTraversalPatterns().some(pattern => pattern.test(input))
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeInput(input: string, options?: {
  allowHtml?: boolean
  maxLength?: number
}): string {
  let sanitized = input.trim()

  if (!options?.allowHtml) {
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
  }

  sanitized = sanitized.replace(/\0/g, '')

  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength)
  }

  return sanitized
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '').replace(/[-]/g, '')
  // Türkiye numaraları: +905551234567, 05551234567 veya 5551234567 formatında
  // ve 5 ile başlamalı (örn: 555, 541, 532 vs.)
  const turkishRegex = /^(\+90|0)?5[0-9]{9}$/
  return turkishRegex.test(cleaned)
}

export function isValidTCNumber(tcNumber: string): boolean {
  if (!/^\d{11}$/.test(tcNumber)) return false
  if (tcNumber[0] === '0') return false

  const digits = tcNumber.split('').map(Number)
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const even = digits[1] + digits[3] + digits[5] + digits[7]
  const digit10 = (odd * 7 - even) % 10
  if (digit10 !== digits[9]) return false

  const total = digits.slice(0, 10).reduce((a, b) => a + b, 0)
  const digit11 = total % 10
  if (digit11 !== digits[10]) return false

  return true
}

export function validateApiInput(
  data: Record<string, unknown>,
  rules: Record<string, 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'tc'>
): ValidationResult {
  for (const [field, type] of Object.entries(rules)) {
    const value = data[field]

    if (value === undefined || value === null) {
      return { valid: false, error: `Field '${field}' is required`, field }
    }

    if (typeof value === 'string') {
      if (containsXSS(value)) {
        logStructured('warn', 'XSS attempt detected', { field, value: value.substring(0, 50) })
        return { valid: false, error: `Field '${field}' contains invalid characters`, field }
      }

      if (containsSQLInjection(value)) {
        logStructured('warn', 'SQL injection attempt detected', { field, value: value.substring(0, 50) })
        return { valid: false, error: `Field '${field}' contains invalid characters`, field }
      }

      if (containsPathTraversal(value)) {
        logStructured('warn', 'Path traversal attempt detected', { field, value: value.substring(0, 50) })
        return { valid: false, error: `Field '${field}' contains invalid characters`, field }
      }
    }

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: `Field '${field}' must be a string`, field }
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `Field '${field}' must be a number`, field }
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `Field '${field}' must be a boolean`, field }
        }
        break
      case 'email':
        if (typeof value !== 'string' || !isValidEmail(value)) {
          return { valid: false, error: `Field '${field}' must be a valid email`, field }
        }
        break
      case 'phone':
        if (typeof value !== 'string' || !isValidPhoneNumber(value)) {
          return { valid: false, error: `Field '${field}' must be a valid phone number`, field }
        }
        break
      case 'tc':
        if (typeof value !== 'string' || !isValidTCNumber(value)) {
          return { valid: false, error: `Field '${field}' must be a valid TC number`, field }
        }
        break
    }
  }

  return { valid: true }
}

export function sanitizeRequestBody(body: unknown): unknown {
  if (typeof body === 'string') {
    return sanitizeInput(body)
  }

  if (Array.isArray(body)) {
    return body.map(item => sanitizeRequestBody(item))
  }

  if (typeof body === 'object' && body !== null) {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (key.startsWith('$')) {
        logStructured('warn', 'NoSQL injection attempt in key', { key })
        continue
      }
      sanitized[key] = sanitizeRequestBody(value)
    }
    return sanitized
  }

  return body
}

export function sanitizeFilename(filename: string): string {
  if (containsPathTraversal(filename)) {
    throw new Error('Invalid filename')
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

export function generateSecureString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }

  return result
}
