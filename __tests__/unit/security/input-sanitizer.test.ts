/**
 * Input Sanitizer Tests
 */

import {
  containsXSS,
  containsSQLInjection,
  containsNoSQLInjection,
  containsPathTraversal,
  escapeHtml,
  sanitizeInput,
  isValidEmail,
  isValidPhoneNumber,
  isValidTCNumber,
  isValidUUID,
  validateApiInput,
  sanitizeFilename,
  generateSecureString,
} from '@/lib/security/input-sanitizer'

describe('Input Sanitizer', () => {
  describe('containsXSS', () => {
    it('should detect script tags', () => {
      expect(containsXSS('<script>alert(1)</script>')).toBe(true)
      expect(containsXSS('<SCRIPT>alert(1)</SCRIPT>')).toBe(true)
    })

    it('should detect javascript protocol', () => {
      expect(containsXSS('javascript:alert(1)')).toBe(true)
    })

    it('should detect event handlers', () => {
      expect(containsXSS('<img onerror=alert(1)>')).toBe(true)
      expect(containsXSS('<button onclick="alert(1)">')).toBe(true)
    })

    it('should allow safe strings', () => {
      expect(containsXSS('Hello World')).toBe(false)
      expect(containsXSS('Test@example.com')).toBe(false)
    })
  })

  describe('containsSQLInjection', () => {
    it('should detect classic SQL injection', () => {
      expect(containsSQLInjection("' OR '1'='1")).toBe(true)
      expect(containsSQLInjection("'; DROP TABLE users; --")).toBe(true)
    })

    it('should detect UNION attacks', () => {
      expect(containsSQLInjection('UNION SELECT * FROM users')).toBe(true)
    })

    it('should allow safe SQL-like strings', () => {
      expect(containsSQLInjection('SELECT * FROM is a book title')).toBe(false)
    })
  })

  describe('containsNoSQLInjection', () => {
    it('should detect NoSQL operators', () => {
      expect(containsNoSQLInjection('{ "$ne": null }')).toBe(true)
      expect(containsNoSQLInjection('{ "$gt": "" }')).toBe(true)
    })

    it('should detect NoSQL operators in objects', () => {
      expect(containsNoSQLInjection({ $ne: null })).toBe(true)
    })

    it('should allow safe strings', () => {
      expect(containsNoSQLInjection('Hello World')).toBe(false)
    })
  })

  describe('containsPathTraversal', () => {
    it('should detect path traversal', () => {
      expect(containsPathTraversal('../../../etc/passwd')).toBe(true)
      expect(containsPathTraversal('..\\\\windows\\\\system32')).toBe(true)
    })

    it('should detect URL encoded traversal', () => {
      expect(containsPathTraversal('%2e%2e%2f')).toBe(true)
    })

    it('should allow safe paths', () => {
      expect(containsPathTraversal('/uploads/file.jpg')).toBe(false)
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>')).toBe('\u0026lt;script\u0026gt;')
      expect(escapeHtml('"test"')).toBe('\u0026quot;test\u0026quot;')
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello')
    })

    it('should remove script tags', () => {
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)')
    })

    it('should respect maxLength', () => {
      expect(sanitizeInput('hello world', { maxLength: 5 })).toBe('hello')
    })

    it('should allow HTML when specified', () => {
      const input = '<b>bold</b>'
      expect(sanitizeInput(input, { allowHtml: true })).toBe('<b>bold</b>')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
    })
  })

  describe('isValidPhoneNumber', () => {
    it('should validate Turkish phone numbers', () => {
      expect(isValidPhoneNumber('+905551234567')).toBe(true)
      expect(isValidPhoneNumber('05551234567')).toBe(true)
      expect(isValidPhoneNumber('5551234567')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false)
      expect(isValidPhoneNumber('abc')).toBe(false)
      expect(isValidPhoneNumber('+90555123456')).toBe(false) // 11 digits required
    })
  })

  describe('isValidTCNumber', () => {
    it('should validate correct TC numbers', () => {
      // Note: This is a test with a valid checksum
      // In real tests, use actual valid TC numbers
      expect(isValidTCNumber('10000000146')).toBe(true)
    })

    it('should reject invalid TC numbers', () => {
      expect(isValidTCNumber('12345678901')).toBe(false)
      expect(isValidTCNumber('01234567890')).toBe(false) // Starts with 0
      expect(isValidTCNumber('1234567890')).toBe(false) // 10 digits
    })
  })

  describe('isValidUUID', () => {
    it('should validate UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
    })
  })

  describe('validateApiInput', () => {
    it('should validate required fields', async () => {
      const result = validateApiInput(
        { name: 'John' },
        { name: 'string', email: 'email' }
      )

      expect(result.valid).toBe(false)
      expect(result.field).toBe('email')
    })

    it('should validate field types', () => {
      const result = validateApiInput(
        { age: 'not-a-number' },
        { age: 'number' }
      )

      expect(result.valid).toBe(false)
    })

    it('should detect XSS in strings', () => {
      const result = validateApiInput(
        { comment: '<script>alert(1)</script>' },
        { comment: 'string' }
      )

      expect(result.valid).toBe(false)
    })

    it('should pass valid input', () => {
      const result = validateApiInput(
        { name: 'John', email: 'john@example.com' },
        { name: 'string', email: 'email' }
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('sanitizeFilename', () => {
    it('should sanitize unsafe characters', () => {
      expect(sanitizeFilename('file<name>.txt')).toBe('file_name_.txt')
    })

    it('should reject path traversal attempts', () => {
      expect(() => sanitizeFilename('../../../etc/passwd')).toThrow('Invalid filename')
    })

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300)
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255)
    })
  })

  describe('generateSecureString', () => {
    it('should generate secure random strings', () => {
      const str1 = generateSecureString(32)
      const str2 = generateSecureString(32)

      expect(str1.length).toBe(32)
      expect(str2.length).toBe(32)
      expect(str1).not.toBe(str2)
    })

    it('should use default length', () => {
      const str = generateSecureString()
      expect(str.length).toBe(32)
    })
  })
})
