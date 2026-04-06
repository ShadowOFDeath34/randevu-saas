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
  sanitizeFilename
} from './input-sanitizer'

describe('Input Sanitizer', () => {
  describe('containsXSS', () => {
    it('should detect script tags', () => {
      expect(containsXSS('<script>alert(1)</script>')).toBe(true)
      expect(containsXSS('<SCRIPT>alert(1)</SCRIPT>')).toBe(true)
      expect(containsXSS('<script src="evil.js">')).toBe(true)
    })

    it('should detect javascript: protocol', () => {
      expect(containsXSS('javascript:alert(1)')).toBe(true)
      expect(containsXSS('JAVASCRIPT:alert(1)')).toBe(true)
    })

    it('should detect event handlers', () => {
      expect(containsXSS('onload=alert(1)')).toBe(true)
      expect(containsXSS('onclick="steal()"')).toBe(true)
      expect(containsXSS("onerror=fetch('/api')")).toBe(true)
    })

    it('should allow safe strings', () => {
      expect(containsXSS('normal text')).toBe(false)
      expect(containsXSS('Merhaba dünya')).toBe(false)
      expect(containsXSS('Test 123 ABC')).toBe(false)
      expect(containsXSS('<div>safe content</div>')).toBe(false)
    })
  })

  describe('containsSQLInjection', () => {
    it('should detect SQL injection attempts', () => {
      expect(containsSQLInjection("'; DROP TABLE users; --")).toBe(true)
      expect(containsSQLInjection('1 UNION SELECT * FROM passwords')).toBe(true)
      expect(containsSQLInjection("' OR '1'='1")).toBe(true)
      expect(containsSQLInjection("admin'--")).toBe(true)
      expect(containsSQLInjection("'; exec xp_cmdshell 'dir'--")).toBe(true)
    })

    it('should allow safe strings', () => {
      expect(containsSQLInjection('normal text')).toBe(false)
      expect(containsSQLInjection("O'Reilly kitabı")).toBe(false)
      expect(containsSQLInjection('Test-123')).toBe(false)
      expect(containsSQLInjection('user@example.com')).toBe(false)
    })
  })

  describe('containsNoSQLInjection', () => {
    it('should detect NoSQL injection attempts', () => {
      expect(containsNoSQLInjection('{ "$ne": null }')).toBe(true)
      expect(containsNoSQLInjection('{"$gt": ""}')).toBe(true)
      expect(containsNoSQLInjection({ $where: 'this.password.length > 0' })).toBe(true)
      expect(containsNoSQLInjection({ $regex: /admin/i })).toBe(true)
    })

    it('should allow safe data', () => {
      expect(containsNoSQLInjection('normal text')).toBe(false)
      expect(containsNoSQLInjection({ name: 'John', age: 30 })).toBe(false)
      expect(containsNoSQLInjection([1, 2, 3])).toBe(false)
    })
  })

  describe('containsPathTraversal', () => {
    it('should detect path traversal attempts', () => {
      expect(containsPathTraversal('../../../etc/passwd')).toBe(true)
      expect(containsPathTraversal('..\\windows\\system32')).toBe(true)
      expect(containsPathTraversal('%2e%2e%2fetc%2fpasswd')).toBe(true)
      expect(containsPathTraversal('....//....//....//etc/passwd')).toBe(true)
    })

    it('should allow safe paths', () => {
      expect(containsPathTraversal('/home/user/file.txt')).toBe(false)
      expect(containsPathTraversal('documents/report.pdf')).toBe(false)
      expect(containsPathTraversal('file..name.txt')).toBe(false)
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;')
      expect(escapeHtml("'test'")).toBe('&#x27;test&#x27;')
      expect(escapeHtml('A & B')).toBe('A &amp; B')
      expect(escapeHtml('</div>')).toBe('&lt;&#x2F;div&gt;')
    })

    it('should handle complex HTML', () => {
      const input = '<div class="test">Hello \'world\' & "universe"</div>'
      const expected = '&lt;div class=&quot;test&quot;&gt;Hello &#x27;world&#x27; &amp; &quot;universe&quot;&lt;&#x2F;div&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
      expect(sanitizeInput('\t\ntest\n\t')).toBe('test')
    })

    it('should remove script tags by default', () => {
      expect(sanitizeInput('hello<script>alert(1)</script>world')).toBe('helloworld')
    })

    it('should remove event handlers', () => {
      expect(sanitizeInput('<div onclick="evil()">test</div>')).toBe('<div>test</div>')
      expect(sanitizeInput('<img onload="steal()" src="test.jpg">')).toBe('<img src="test.jpg">')
    })

    it('should respect maxLength option', () => {
      expect(sanitizeInput('very long text', { maxLength: 4 })).toBe('very')
      expect(sanitizeInput('short', { maxLength: 100 })).toBe('short')
    })

    it('should allow HTML when specified', () => {
      const input = '<p>Hello <script>alert(1)</script>world</p>'
      expect(sanitizeInput(input, { allowHtml: true })).toBe(input)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@@example.com')).toBe(false)
      expect(isValidEmail('test@example')).toBe(false)
    })

    it('should reject emails over 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      expect(isValidEmail(longEmail)).toBe(false)
    })
  })

  describe('isValidPhoneNumber', () => {
    it('should validate Turkish phone numbers', () => {
      expect(isValidPhoneNumber('5551234567')).toBe(true)
      expect(isValidPhoneNumber('05551234567')).toBe(true)
      expect(isValidPhoneNumber('+905551234567')).toBe(true)
      expect(isValidPhoneNumber('555 123 45 67')).toBe(true)
      expect(isValidPhoneNumber('555-123-45-67')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(false)
      expect(isValidPhoneNumber('555123456')).toBe(false)
      expect(isValidPhoneNumber('abc')).toBe(false)
      expect(isValidPhoneNumber('')).toBe(false)
    })
  })

  describe('isValidTCNumber', () => {
    it('should validate correct TC numbers', () => {
      // Valid TC number (algorithmically correct)
      expect(isValidTCNumber('10000000146')).toBe(true)
    })

    it('should reject invalid TC numbers', () => {
      expect(isValidTCNumber('')).toBe(false)
      expect(isValidTCNumber('1234567890')).toBe(false) // 10 digits
      expect(isValidTCNumber('12345678901')).toBe(false) // Wrong algorithm
      expect(isValidTCNumber('abcdefghijk')).toBe(false)
      expect(isValidTCNumber('01234567890')).toBe(false) // Starts with 0
    })
  })

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
      expect(isValidUUID('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')).toBe(false)
    })
  })

  describe('sanitizeFilename', () => {
    it('should sanitize special characters', () => {
      expect(sanitizeFilename('test<file>.txt')).toBe('test_file_.txt')
      expect(sanitizeFilename('hello:world.pdf')).toBe('hello_world.pdf')
      expect(sanitizeFilename('file\nname.doc')).toBe('file_name.doc')
    })

    it('should handle multiple underscores', () => {
      expect(sanitizeFilename('test!!!file.txt')).toBe('test_file.txt')
      expect(sanitizeFilename('a__b__c.txt')).toBe('a_b_c.txt')
    })

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt'
      expect(sanitizeFilename(longName).length).toBe(255)
    })

    it('should throw on path traversal attempts', () => {
      expect(() => sanitizeFilename('../../../etc/passwd')).toThrow('Invalid filename')
      expect(() => sanitizeFilename('..\\windows\\system32')).toThrow('Invalid filename')
    })
  })
})
