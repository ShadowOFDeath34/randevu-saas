import { describe, it, expect, vi } from 'vitest'
import {
  cn,
  slugify,
  formatDate,
  formatDateTime,
  formatTime,
  addMinutesToTime,
  timeToMinutes,
  minutesToTime,
  getDayName,
  formatCurrency,
  generateConfirmationCode,
} from './utils'

describe('cn (className merge)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('slugify', () => {
  it('should convert Turkish characters to ASCII', () => {
    expect(slugify('Çarşamba')).toBe('carsamba')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(slugify('test@#$%file')).toBe('testfile')
  })
})

describe('formatDate', () => {
  it('should format date in Turkish format', () => {
    const date = '2024-03-15'
    const formatted = formatDate(date)
    expect(formatted).toBe('15.03.2024')
  })
})

describe('formatTime', () => {
  it('should convert 24h to 12h format with AM/PM', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
    expect(formatTime('09:00')).toBe('9:00 AM')
    expect(formatTime('00:00')).toBe('12:00 AM')
  })
})

describe('addMinutesToTime', () => {
  it('should add minutes to time correctly', () => {
    expect(addMinutesToTime('14:00', 30)).toBe('14:30')
    expect(addMinutesToTime('14:30', 30)).toBe('15:00')
    expect(addMinutesToTime('23:30', 60)).toBe('24:30')
  })
})

describe('timeToMinutes', () => {
  it('should convert time to minutes', () => {
    expect(timeToMinutes('14:30')).toBe(870)
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('01:00')).toBe(60)
  })
})

describe('minutesToTime', () => {
  it('should convert minutes to time', () => {
    expect(minutesToTime(870)).toBe('14:30')
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(60)).toBe('01:00')
  })
})

describe('getDayName', () => {
  it('should return correct day names', () => {
    expect(getDayName(0)).toBe('Pazar')
    expect(getDayName(1)).toBe('Pazartesi')
    expect(getDayName(6)).toBe('Cumartesi')
  })

  it('should handle out of bounds indices', () => {
    expect(getDayName(7)).toBeUndefined()
    expect(getDayName(-1)).toBeUndefined()
  })
})

describe('formatDateTime', () => {
  it('should format date with time in Turkish format', () => {
    const result = formatDateTime('2024-03-15T14:30:00')
    expect(result).toContain('15.03.2024')
    expect(result).toContain('14:30')
  })

  it('should handle Date object input', () => {
    const result = formatDateTime(new Date('2024-03-15T14:30:00'))
    expect(result).toContain('15.03.2024')
  })
})

describe('formatCurrency', () => {
  it('should format currency with Turkish Lira', () => {
    expect(formatCurrency(100)).toContain('100')
    expect(formatCurrency(1000)).toContain('1.000')
  })

  it('should round to nearest integer', () => {
    expect(formatCurrency(100.4)).toContain('100')
    expect(formatCurrency(100.5)).toContain('101')
  })
})

describe('generateConfirmationCode', () => {
  it('should generate uppercase hex code', async () => {
    const code = await generateConfirmationCode()
    expect(code).toMatch(/^[0-9A-F]+$/)
    expect(code.length).toBeGreaterThanOrEqual(8)
  })

  it('should generate unique codes', async () => {
    const codes = await Promise.all([
      generateConfirmationCode(),
      generateConfirmationCode(),
      generateConfirmationCode(),
    ])
    const unique = new Set(codes)
    expect(unique.size).toBe(3)
  })
})

describe('slugify extended', () => {
  it('should handle all Turkish characters', () => {
    expect(slugify('İstanbul Çanakkale Şırnak')).toBe('istanbul-canakkale-sirnak')
    expect(slugify('GÜNEŞ Özgür')).toBe('gunes-ozgur')
    expect(slugify('ğüşiöç')).toBe('gusioc')
  })

  it('should trim and normalize multiple spaces', () => {
    expect(slugify('  hello   world  ')).toBe('hello-world')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('should handle numbers', () => {
    expect(slugify('test-123-file')).toBe('test-123-file')
    expect(slugify('version 2.0')).toBe('version-20')
  })
})

describe('cn extended', () => {
  it('should handle undefined and null', () => {
    expect(cn(undefined, 'class', null)).toBe('class')
  })

  it('should handle array syntax', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('should deduplicate classes', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })
})
