import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn utility helper', () => {
  it('combines class names correctly', () => {
    const result = cn('bg-red-500', 'text-white')
    expect(result).toBe('bg-red-500 text-white')
  })

  it('merges tailwind classes properly by overriding conflicts', () => {
    const result = cn('p-4 p-8')
    expect(result).toBe('p-8')
  })

  it('filters out falsy values', () => {
    const isHidden = false
    const result = cn('active', isHidden && 'hidden', null, undefined, 'visible')
    expect(result).toBe('active visible')
  })
})
