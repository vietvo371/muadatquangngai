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

test.describe('Admin Transactions Management Flow', () => {
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
        pending_properties: 1,
        total_revenue: 45000000,
        new_users_today: 5,
        new_listings_today: 12,
        pending_reports: 3,
      },
    });

    // Mock transaction stats call (specific regex to avoid list wildcard intercepting)
    await mockApi(page, /\/api\/admin\/transactions\/stats/, 200, {
      total_revenue: 45000000,
      total_transactions: 120,
      pending_count: 5,
    });

    // Mock transaction list call (specific regex that does not match /stats)
    await mockApi(page, /\/api\/admin\/transactions(\?|$)/, 200, {
      data: [
        {
          id: 301,
          type: 'deposit',
          amount: 5000000,
          status: 'pending',
          user: {
            id: 201,
            name: 'Nguyễn E2E Broker',
            email: 'e2ebroker@gmail.com',
          },
          created_at: '2026-05-20T10:30:00Z',
          updated_at: '2026-05-20T10:30:00Z',
        },
        {
          id: 302,
          type: 'purchase',
          amount: 1500000,
          status: 'success',
          user: {
            id: 202,
            name: 'Nguyễn Success Broker',
            email: 'successbroker@gmail.com',
          },
          created_at: '2026-05-19T10:30:00Z',
          updated_at: '2026-05-19T10:30:00Z',
        },
      ],
      links: {
        first: 'http://localhost:8000/api/admin/transactions?page=1',
        last: 'http://localhost:8000/api/admin/transactions?page=1',
        prev: null,
        next: null,
      },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 5,
        to: 2,
        total: 2,
      },
    });
  });

  test('should display transaction stats and table successfully', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('/admin/transactions');

    // Verify analytics stats card displays formatted numbers
    const totalRevText = page.locator('text=45 triệu'); // 45,000,000 formatted as "45 triệu"
    await expect(totalRevText).toBeVisible();

    // Verify users list rows are present
    await expect(page.locator('text=Nguyễn E2E Broker')).toBeVisible();
    await expect(page.locator('text=Nguyễn Success Broker')).toBeVisible();

    // Verify transaction amount format
    await expect(page.locator('text=+ 5 triệu')).toBeVisible(); // + 5,000,000 -> + 5 triệu
  });

  test('should handle optimistic approval for pending transaction', async ({ page }) => {
    // Mock approve endpoint success
    await mockApi(page, '**/api/admin/transactions/301/approve', 200, {
      success: true,
      message: 'Duyệt giao dịch thành công.',
    });

    // Navigate to transactions page
    await page.goto('/admin/transactions');

    // Find the more options button for the pending row inside the table
    const moreBtn = page.locator('table tbody tr').first().locator('button');
    await moreBtn.click();

    // Click "Duyệt giao dịch" — target menuitem role specifically to avoid description text conflict
    const approveMenuBtn = page.locator('[role="menuitem"]:has-text("Duyệt giao dịch")').first();
    await approveMenuBtn.click();

    // Confirm dialog should appear
    const dialogTitle = page.locator('text=Phê duyệt giao dịch');
    await expect(dialogTitle).toBeVisible();

    // Click "Phê duyệt" button in dialog
    const confirmBtn = page.locator('[role="dialog"] button:has-text("Phê duyệt")');
    await confirmBtn.click();

    // Toast alert should report success
    await expect(page.locator('text=Đã phê duyệt giao dịch thành công')).toBeVisible();
  });

  test('should handle optimistic refund for successful transaction', async ({ page }) => {
    // Mock refund endpoint success
    await mockApi(page, '**/api/admin/transactions/302/refund', 200, {
      success: true,
      message: 'Hoàn tiền giao dịch thành công.',
    });

    // Navigate to transactions page
    await page.goto('/admin/transactions');

    // Find and click the "Hoàn tiền" button in the table row
    const refundBtn = page.locator('table tbody tr').locator('button:has-text("Hoàn tiền")').first();
    await expect(refundBtn).toBeVisible();
    await refundBtn.click();

    // Confirm dialog should appear
    const dialogTitle = page.locator('text=Hoàn tiền giao dịch');
    await expect(dialogTitle).toBeVisible();

    // Click destructive "Hoàn tiền" confirm button inside dialog
    const confirmBtn = page.locator('[role="dialog"] button:has-text("Hoàn tiền")');
    await confirmBtn.click();

    // Toast alert should show success
    await expect(page.locator('text=Đã thực hiện hoàn tiền giao dịch thành công')).toBeVisible();
  });
});
