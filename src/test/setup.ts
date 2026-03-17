import '@testing-library/jest-dom'
import { expect } from 'vitest'

// Extend vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void
    toHaveClass(className: string): void
    toBeVisible(): void
  }
}
