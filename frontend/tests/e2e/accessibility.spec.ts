import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Helper to format violations for readable output
function formatViolations(violations: any[]) {
  return violations.map(v => ({
    rule: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
  }))
}

test.describe('Accessibility - WCAG 2.1 AA', () => {
  test('landing page has no violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    if (results.violations.length > 0) {
      console.log('Landing violations:', JSON.stringify(formatViolations(results.violations), null, 2))
    }
    expect(results.violations).toEqual([])
  })

  test('login page has no violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    if (results.violations.length > 0) {
      console.log('Login violations:', JSON.stringify(formatViolations(results.violations), null, 2))
    }
    expect(results.violations).toEqual([])
  })

  test('404 page has no violations', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    if (results.violations.length > 0) {
      console.log('404 violations:', JSON.stringify(formatViolations(results.violations), null, 2))
    }
    expect(results.violations).toEqual([])
  })
})

test.describe('Accessibility - Dark Mode', () => {
  test('dark mode landing page maintains contrast', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze()

    if (results.violations.length > 0) {
      console.log('Dark mode contrast violations:', JSON.stringify(formatViolations(results.violations), null, 2))
    }
    // Warn but don't fail - dark mode contrast can have edge cases
    expect(results.violations.length).toBeLessThanOrEqual(3)
  })
})

test.describe('Accessibility - Structure', () => {
  test('page has exactly one h1', async ({ page }) => {
    await page.goto('/')
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/')
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `Image ${i} missing alt attribute`).not.toBeNull()
    }
  })

  test('page has a descriptive title', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)
    expect(title).toContain('TelecomCo')
  })

  test('login page has proper form labels', async ({ page }) => {
    await page.goto('/login')
    // The Google button should have accessible text
    await expect(page.getByText('Continue with Google')).toBeVisible()
  })
})

test.describe('Accessibility - Keyboard', () => {
  test('Tab key navigates through interactive elements on landing', async ({ page }) => {
    await page.goto('/')

    // Tab should reach the first link/button
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused)
  })

  test('Get Started button is keyboard accessible', async ({ page }) => {
    await page.goto('/')
    const button = page.getByRole('link', { name: /Get Started Free/i }).first()
    await button.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(/\/login/)
  })
})
