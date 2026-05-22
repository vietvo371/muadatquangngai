/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

// CORS-enabled api mock helper
async function mockApi(
  page: any,
  urlPattern: string | RegExp | ((url: URL) => boolean),
  status: number,
  body: unknown
) {
  await page.route(urlPattern, async (route: any) => {
    const headers = {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
    };

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 200,
        headers,
      });
      return;
    }

    await route.fulfill({
      status,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(body),
    });
  });
}

test.describe('Admin Authentication Flow', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Catch-all for ANY unmocked admin API calls
    //    Registered FIRST so that specific mocks (added below) take PRIORITY
    //    (Playwright: last registered route wins)
    await page.route('**/api/admin/**', async (route: any) => {
      const headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
      };
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    // 2. Mock the double protection /api/user/me call (higher priority, added after catch-all)
    await mockApi(page, '**/api/user/me', 200, {
      success: true,
      data: {
        id: 1,
        name: 'Admin BatDongSan',
        email: 'admin@bds.vn',
        role: 'admin',
      },
    });

    // 3. Mock dashboard stats which are requested in layout (higher priority, added after catch-all)
    await mockApi(page, '**/api/admin/dashboard', 200, {
      success: true,
      data: {
        total_users: 150,
        total_properties: 1200,
        active_properties: 1050,
        pending_properties: 15,
        total_revenue: 45000000,
        new_users_today: 5,
        new_listings_today: 12,
        pending_reports: 3,
      },
    });
  });


  test('should show error when login fails', async ({ page }) => {
    // Mock failed login
    await mockApi(page, '**/api/auth/login', 401, {
      success: false,
      message: 'Thông tin đăng nhập không chính xác.',
    });

    // Go to login page
    await page.goto('/login');

    // Fill credentials
    await page.fill('#email', 'wrong@bds.vn');
    await page.fill('#password', 'wrongpassword');

    // Click submit
    await page.click('button[type="submit"]');

    // Expect to see the error message
    const errorAlert = page.locator('text=Thông tin đăng nhập không chính xác.');
    await expect(errorAlert).toBeVisible();
  });


  test('should login successfully as admin and redirect to admin dashboard', async ({ page }) => {
    // Mock successful login
    await mockApi(page, '**/api/auth/login', 200, {
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Admin BatDongSan',
          email: 'admin@bds.vn',
          role: 'admin',
        },
        access_token: 'mock-admin-token-12345',
      },
    });

    // Go to login page
    await page.goto('/login');

    // Fill credentials
    await page.fill('#email', 'admin@bds.vn');
    await page.fill('#password', 'admin123');

    // Click submit
    await page.click('button[type="submit"]');

    // Verify redirected to admin
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

    // Verify breadcrumbs and header loaded (use .first() to avoid strict mode violation with multiple matches on dashboard)
    const breadcrumb = page.locator('text=Hệ thống').first();
    await expect(breadcrumb).toBeVisible();

    // Verify token saved to localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBe('mock-admin-token-12345');

    // Verify authStore state persisted to localStorage
    const authStore = await page.evaluate(() => localStorage.getItem('auth-storage'));
    expect(authStore).toContain('mock-admin-token-12345');
    expect(authStore).toContain('Admin BatDongSan');
  });

  test('should logout via dialog and clear session', async ({ page }) => {
    // Pre-populate localStorage to simulate authenticated admin session (avoids reload race condition)
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-admin-token-12345');
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 1,
              name: 'Admin BatDongSan',
              email: 'admin@bds.vn',
              role: 'admin',
            },
            accessToken: 'mock-admin-token-12345',
            isAuthenticated: true,
          },
          version: 0,
        })
      );
    });

    // Navigate directly to admin dashboard
    await page.goto('/admin');

    // Verify admin page loaded
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Hệ thống').first()).toBeVisible();

    // Profile menu trigger — use data-testid for reliable targeting
    const profileTrigger = page.locator('[data-testid="profile-dropdown-trigger"]');
    await profileTrigger.click();

    // Wait for dropdown menu to open
    await page.locator('[role="menu"]').waitFor({ state: 'visible' });

    // Click Logout via data-testid
    const logoutBtn = page.locator('[data-testid="logout-menu-item"]');
    await logoutBtn.click();

    // Confirm dialog should appear
    const confirmTitle = page.locator('text=Đăng xuất tài khoản?');
    await expect(confirmTitle).toBeVisible();

    // Click "Đăng xuất" button in the dialog (scoped within dialog to avoid matching dropdown item)
    const confirmBtn = page.locator('[role="dialog"] button:has-text("Đăng xuất")');
    await confirmBtn.click();

    // Verify redirected back to login page
    await expect(page).toHaveURL(/\/login/);

    // Verify token removed from local storage
    const tokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(tokenAfter).toBeNull();
  });
});

