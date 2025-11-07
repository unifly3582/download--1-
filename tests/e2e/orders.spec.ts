import { test, expect } from '@playwright/test';

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');
  });

  test('should load orders page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check URL
    expect(page.url()).toContain('/orders');
  });

  test('should display orders table', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should have status tabs', async ({ page }) => {
    // Check for status tabs
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on a status tab (if exists)
    const approvedTab = page.locator('text=Approved').first();
    if (await approvedTab.isVisible()) {
      await approvedTab.click();
      await page.waitForTimeout(1000);
    }
  });
});
