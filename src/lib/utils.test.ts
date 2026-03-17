import { describe, it, expect } from 'vitest'
import {
  cn,
  slugify,
  formatDate,
  formatTime,
  addMinutesToTime,
  timeToMinutes,
  minutesToTime,
  getDayName,
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
})
