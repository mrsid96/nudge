import { test, expect } from '@playwright/test'

test('shows login page when not authenticated', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Nudge')).toBeVisible()
})

test('login page has Google sign in', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible()
})
