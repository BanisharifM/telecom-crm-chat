import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login from /chat', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected to login from /explorer', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Continue with Google')).toBeVisible()
  })

  test('landing page is accessible without auth', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Ask Your Customer Data')).toBeVisible()
  })
})
