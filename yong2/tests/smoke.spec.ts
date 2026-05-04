import { test, expect } from '@playwright/test';

test.describe('yong2 smoke', () => {
  test('home renders hero + sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Desert Living');
    await expect(page.getByText('Meet Your Advisor')).toBeVisible();
    await expect(page.getByRole('link', { name: /Begin a Conversation/ })).toBeVisible();
  });

  test('portfolio page renders filter bar', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.getByRole('heading', { name: 'The Portfolio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Active' })).toBeVisible();
  });

  test('communities page renders cards', async ({ page }) => {
    await page.goto('/communities');
    await expect(page.getByRole('heading', { name: 'The Communities' })).toBeVisible();
  });

  test('about page renders headline + stats', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('fewer, better')).toBeVisible();
    await expect(page.getByText('Career Sales', { exact: true })).toBeVisible();
  });

  test('contact page renders form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel('Your Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('nav links navigate between pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Portfolio' }).first().click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});
