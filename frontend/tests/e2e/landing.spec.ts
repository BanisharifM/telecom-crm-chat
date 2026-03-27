import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero section', async ({ page }) => {
    await expect(page.getByText('Ask Your Customer Data')).toBeVisible()
    await expect(page.getByText('Get Started Free')).toBeVisible()
  })

  test('navbar shows logo and login button', async ({ page }) => {
    await expect(page.getByText('TelecomCo')).toBeVisible()
    await expect(page.getByText('Log In')).toBeVisible()
  })

  test('features section renders', async ({ page }) => {
    await expect(page.getByText('Natural Language Queries')).toBeVisible()
    await expect(page.getByText('CRM Dashboards')).toBeVisible()
    await expect(page.getByText('Churn Prediction')).toBeVisible()
  })

  test('footer renders', async ({ page }) => {
    await expect(page.getByText('Mahdi BanisharifDehkordi')).toBeVisible()
  })

  test('Get Started navigates to login', async ({ page }) => {
    await page.getByRole('link', { name: /Get Started Free/i }).first().click()
    await expect(page).toHaveURL(/\/login/)
  })
})
