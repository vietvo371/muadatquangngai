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

test.describe('Admin Properties Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up local storage mock session
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

    // Mock the double protection /api/user/me call
    await mockApi(page, '**/api/user/me', 200, {
      success: true,
      data: {
        id: 1,
        name: 'Admin BatDongSan',
        email: 'admin@bds.vn',
        role: 'admin',
      },
    });

    // Mock dashboard stats which are requested in layout
    await mockApi(page, '**/api/admin/dashboard', 200, {
      success: true,
      data: {
        total_users: 150,
        total_properties: 1200,
        active_properties: 1050,
        pending_properties: 1, // we have 1 pending property
        total_revenue: 45000000,
        new_users_today: 5,
        new_listings_today: 12,
        pending_reports: 3,
      },
    });

    // Mock list of properties
    await mockApi(page, '**/api/admin/properties**', 200, {
      data: [
        {
          id: 99,
          title: 'Can ho E2E Test pending approve',
          slug: 'can-ho-e2e-test-pending-approve',
          price: 3000000000,
          area: 80,
          thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop',
          status: 'pending',
          type: 'sale',
          category: { id: 1, name: 'Căn hộ' },
          province: { id: 1, name: 'Quảng Ngãi' },
          user: { id: 10, name: 'Nguyen Môi Giới' },
          created_at: '2026-05-20T10:00:00Z',
        },
      ],
      links: {
        first: 'http://localhost:8000/api/admin/properties?page=1',
        last: 'http://localhost:8000/api/admin/properties?page=1',
        prev: null,
        next: null,
      },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 5,
        to: 1,
        total: 1,
      },
    });
  });

  test('should load property list and handle optimistic approval', async ({ page }) => {
    // Mock successful approve API
    await mockApi(page, '**/api/admin/properties/99/approve', 200, {
      success: true,
      message: 'Đã phê duyệt tin đăng thành công.',
    });

    // Go to admin properties page
    await page.goto('/admin/properties');

    // Wait for the properties page to load and confirm mocked listing is visible
    const propertyTitle = page.locator('text=Can ho E2E Test pending approve');
    await expect(propertyTitle).toBeVisible();

    // Verify it is in 'Chờ duyệt' status (Vietnam locale)
    const pendingBadge = page.locator('text=Chờ duyệt').first();
    await expect(pendingBadge).toBeVisible();

    // Click on the action button (MoreVertical) for this property in the table row
    const actionBtn = page.locator('table tbody tr').first().locator('button');
    await actionBtn.click();

    // Click 'Phê duyệt tin'
    const approveBtn = page.locator('text=Phê duyệt tin');
    await approveBtn.click();

    // Wait for success toast
    const toastMessage = page.locator('text=Đã phê duyệt tin đăng');
    await expect(toastMessage).toBeVisible();
  });

  test('should handle optimistic rejection with a reason in modal dialog', async ({ page }) => {
    // Mock successful reject API
    await mockApi(page, '**/api/admin/properties/99/reject', 200, {
      success: true,
      message: 'Đã từ chối duyệt tin đăng thành công.',
    });

    // Go to admin properties page
    await page.goto('/admin/properties');

    // Confirm listing is visible
    await expect(page.locator('text=Can ho E2E Test pending approve')).toBeVisible();

    // Click on action button in the table row
    const actionBtn = page.locator('table tbody tr').first().locator('button');
    await actionBtn.click();

    // Click 'Từ chối duyệt'
    const rejectMenuBtn = page.locator('text=Từ chối duyệt');
    await rejectMenuBtn.click();

    // Rejection dialog should open
    const dialogTitle = page.getByRole('heading', { name: 'Từ chối duyệt tin đăng' });
    await expect(dialogTitle).toBeVisible();

    // Type reject reason
    await page.fill('textarea[placeholder*="Giá bán không hợp lệ"]', 'Hình ảnh mờ và thiếu thông tin pháp lý');

    // Click the submit button inside reject dialog
    const submitRejectBtn = page.locator('button:has-text("Từ chối duyệt tin")');
    await submitRejectBtn.click();

    // The toast message should appear and the dialog should close
    await expect(page.locator('text=Đã từ chối duyệt tin đăng')).toBeVisible();
    await expect(dialogTitle).not.toBeVisible();
  });
});
