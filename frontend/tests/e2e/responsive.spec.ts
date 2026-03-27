import { test, expect } from '@playwright/test'

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

test.describe('Responsive Design', () => {
  for (const bp of BREAKPOINTS) {
    test.describe(`${bp.name} (${bp.width}x${bp.height})`, () => {
      test.use({ viewport: { width: bp.width, height: bp.height } })

      test('landing page renders without overflow', async ({ page }) => {
        await page.goto('/')
        // No horizontal scrollbar
        const body = page.locator('body')
        const bodyWidth = await body.evaluate(el => el.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(bp.width + 1)
      })

      test('landing hero text is visible', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('Ask Your Customer Data')).toBeVisible()
      })

      test('login page renders correctly', async ({ page }) => {
        await page.goto('/login')
        await expect(page.getByText('Continue with Google')).toBeVisible()
      })

      test('404 page renders', async ({ page }) => {
        await page.goto('/nonexistent-page-xyz')
        await expect(page.getByText('Signal Lost')).toBeVisible()
      })

      test(`screenshot - landing (${bp.name})`, async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: `tests/e2e/screenshots/landing-${bp.name}.png`, fullPage: true })
      })

      test(`screenshot - login (${bp.name})`, async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: `tests/e2e/screenshots/login-${bp.name}.png`, fullPage: true })
      })
    })
  }
})
