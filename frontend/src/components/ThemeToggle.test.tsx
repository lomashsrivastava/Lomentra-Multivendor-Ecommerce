import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle Component', () => {
  it('renders theme toggler button correctly', () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeDefined()
  })

  it('toggles theme state on button click', () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: /toggle theme/i })

    // Click the toggle button to switch from default (light) to dark
    fireEvent.click(button)

    expect(window.localStorage.getItem('test-theme')).toBe('dark')
  })
})
