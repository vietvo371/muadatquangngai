/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

// Centralized mock registry mapped by page to avoid route bypassing/hijacking issues
const pageMocks = new Map<any, Array<{ method: string; pattern: string; status: number; body: any }>>();

function wildcardMatch(url: string, pattern: string): boolean {
  // Convert glob pattern to a regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex chars
    .replace(/\*/g, '.*');               // Convert wildcards to .*
  return new RegExp(regexPattern).test(url);
}

// CORS-enabled api mock helper
async function mockApi(
  page: any,
  urlPattern: string,
  status: number,
  body: unknown,
  method?: string
) {
  // Initialize mock array for this page if not exists
  if (!pageMocks.has(page)) {
    pageMocks.set(page, []);
    
    // Register the single page route for all API requests to ensure strict ordering & routing
    await page.route('**/api/**', async (route: any) => {
      const request = route.request();
      const requestMethod = request.method().toUpperCase();
      const url = request.url();

      if (requestMethod === 'OPTIONS') {
        const headers = {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
        };
        await route.fulfill({ status: 200, headers });
        return;
      }

      const mocks = pageMocks.get(page) || [];
      // Find a matching mock from the mocks array (search in reverse order so newer mocks override older ones)
      const matchingMock = [...mocks].reverse().find(m => {
        // Method match
        if (m.method && m.method !== requestMethod) return false;
        
        // Wildcard URL match
        return wildcardMatch(url, m.pattern);
      });

      if (matchingMock) {
        console.log(`[MOCK TRACE] Fulfill MATCHED: ${requestMethod} ${url} with status ${matchingMock.status}`);
        const headers = {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
        };
        await route.fulfill({
          status: matchingMock.status,
          contentType: 'application/json',
          headers,
          body: JSON.stringify(matchingMock.body),
        });
      } else {
        console.log(`[MOCK TRACE] No match found: ${requestMethod} ${url} - passing to network`);
        await route.continue();
      }
    });
  }

  // Add the mock to the list
  const methodStr = method ? method.toUpperCase() : '';
  pageMocks.get(page)!.push({
    method: methodStr,
    pattern: urlPattern,
    status,
    body,
  });
  console.log(`[MOCK REGISTRY] Registered: ${methodStr || 'ANY'} ${urlPattern}`);
}

test.describe('Admin Create and Edit Dialogs E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeout for compilation delays on cold-starts
    test.setTimeout(90000);

    // Capture browser console logs
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
    });

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

    // Mock layout API calls
    await mockApi(page, '**/api/user/me', 200, {
      success: true,
      data: {
        id: 1,
        name: 'Admin BatDongSan',
        email: 'admin@bds.vn',
        role: 'admin',
      },
    }, 'GET');

    await mockApi(page, '**/api/admin/dashboard', 200, {
      success: true,
      data: {
        total_users: 150,
        total_properties: 1200,
        active_properties: 1050,
        pending_properties: 0,
        total_revenue: 45000000,
        new_users_today: 5,
        new_listings_today: 12,
        pending_reports: 3,
      },
    }, 'GET');
  });

  test.describe('Category Management Dialogs', () => {
    test.beforeEach(async ({ page }) => {
      // Mock category list API call
      await mockApi(page, '**/api/admin/categories**', 200, {
        data: [
          {
            id: 1,
            name: 'Bán Đất Nền',
            slug: 'ban-dat-nen',
            description: 'Mua bán đất nền dự án tại Quảng Ngãi.',
            icon: 'map',
            sort_order: 1,
            is_active: true,
            created_at: '2026-01-01T08:00:00Z',
          },
        ],
        links: {
          first: 'http://localhost:8000/api/admin/categories?page=1',
          last: 'http://localhost:8000/api/admin/categories?page=1',
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
      }, 'GET');
    });

    test('should open create dialog, fill details, and submit successfully', async ({ page }) => {
      // Mock create category API call
      await mockApi(page, '**/api/admin/categories', 200, {
        success: true,
        data: {
          id: 2,
          name: 'Căn Hộ Chung Cư',
          slug: 'can-ho-chung-cu',
          description: 'Căn hộ chung cư cao cấp',
          icon: 'building',
          sort_order: 2,
          is_active: true,
        },
      }, 'POST');

      await page.goto('/admin/categories');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Bán Đất Nền').first()).toBeVisible({ timeout: 60000 });

      // Click "Thêm danh mục" button
      await page.locator('[data-testid="create-category-btn"]').click();

      // Check if dialog is open (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Thêm danh mục mới")')).toBeVisible();

      // Fill form values
      await page.locator('[data-testid="category-name-input"]').fill('Căn Hộ Chung Cư');
      await page.locator('[data-testid="category-slug-input"]').fill('can-ho-chung-cu');
      await page.locator('[data-testid="category-desc-textarea"]').fill('Căn hộ chung cư cao cấp');
      await page.locator('[data-testid="category-icon-input"]').fill('building');
      await page.locator('[data-testid="category-sort-input"]').fill('2');

      // Check the checkbox if it is not checked
      const isActiveCheckbox = page.locator('[data-testid="category-active-checkbox"]');
      const isChecked = await isActiveCheckbox.isChecked();
      if (!isChecked) {
        await isActiveCheckbox.check();
      }

      // Submit form
      await page.locator('[data-testid="category-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=Thành công')).toBeVisible();
      await expect(page.locator('h2:has-text("Thêm danh mục mới")')).not.toBeVisible();
    });

    test('should open edit dialog, load current details, and edit successfully', async ({ page }) => {
      // Mock edit category API call
      await mockApi(page, '**/api/admin/categories/1', 200, {
        success: true,
        data: {
          id: 1,
          name: 'Bán Đất Nền Cập Nhật',
          slug: 'ban-dat-nen-cap-nhat',
          description: 'Mua bán đất nền cập nhật',
          icon: 'map',
          sort_order: 1,
          is_active: true,
        },
      }, 'PUT');

      await page.goto('/admin/categories');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Bán Đất Nền').first()).toBeVisible({ timeout: 60000 });

      // Click the row actions button (three dots) to open menu
      const actionBtn = page.locator('table tbody tr').first().locator('button').last();
      await actionBtn.click();

      // Click edit button for the category with id 1
      await page.locator('[data-testid="edit-category-btn-1"]').click();

      // Check if dialog is open with edit title (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Chỉnh sửa danh mục")')).toBeVisible();

      // Verify currently loaded details
      await expect(page.locator('[data-testid="category-name-input"]')).toHaveValue('Bán Đất Nền');
      await expect(page.locator('[data-testid="category-slug-input"]')).toHaveValue('ban-dat-nen');

      // Change a field
      await page.locator('[data-testid="category-name-input"]').fill('Bán Đất Nền Cập Nhật');

      // Submit form
      await page.locator('[data-testid="category-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=Thành công')).toBeVisible();
      await expect(page.locator('h2:has-text("Chỉnh sửa danh mục")')).not.toBeVisible();
    });
  });

  test.describe('Package Management Dialogs', () => {
    test.beforeEach(async ({ page }) => {
      // Mock package list API call
      await mockApi(page, '**/api/admin/packages**', 200, {
        data: [
          {
            id: 1,
            name: 'Gói VIP Thường',
            type: 'vip',
            price: 100000,
            duration_days: 30,
            highlight_color: '#1075b1',
            features: ['Đăng tin nhanh'],
            sort_order: 1,
            is_active: true,
          },
        ],
      }, 'GET');
    });

    test('should open create dialog, fill details, and submit successfully', async ({ page }) => {
      // Mock create package API call
      await mockApi(page, '**/api/admin/packages', 200, {
        success: true,
        data: {
          id: 2,
          name: 'Gói VIP Diamond',
          type: 'diamond',
          price: 500000,
          duration_days: 30,
          highlight_color: '#e03131',
          features: ['Nổi bật trang chủ'],
          sort_order: 2,
          is_active: true,
        },
      }, 'POST');

      await page.goto('/admin/packages');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Gói VIP Thường').first()).toBeVisible({ timeout: 60000 });

      // Click "Thêm gói dịch vụ mới" button
      await page.locator('[data-testid="create-package-btn"]').click();

      // Check if dialog is open (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Thêm gói dịch vụ mới")')).toBeVisible();

      // Fill form values
      await page.locator('[data-testid="package-name-input"]').fill('Gói VIP Diamond');
      await page.locator('[data-testid="package-duration-input"]').fill('30');
      await page.locator('[data-testid="package-price-input"]').fill('500000');
      await page.locator('[data-testid="package-color-input"]').fill('#e03131');
      await page.locator('[data-testid="package-sort-input"]').fill('2');

      // Check the checkbox if it is not checked
      const isActiveCheckbox = page.locator('[data-testid="package-active-checkbox"]');
      const isChecked = await isActiveCheckbox.isChecked();
      if (!isChecked) {
        await isActiveCheckbox.check();
      }

      // Submit form
      await page.locator('[data-testid="package-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=thành công')).toBeVisible();
      await expect(page.locator('h2:has-text("Thêm gói dịch vụ mới")')).not.toBeVisible();
    });

    test('should open edit dialog, load current details, and edit successfully', async ({ page }) => {
      // Mock edit package API call
      await mockApi(page, '**/api/admin/packages/1', 200, {
        success: true,
        data: {
          id: 1,
          name: 'Gói VIP Thường Cập Nhật',
          type: 'vip',
          price: 120000,
          duration_days: 30,
          highlight_color: '#1075b1',
          features: ['Đăng tin nhanh'],
          sort_order: 1,
          is_active: true,
        },
      }, 'PUT');

      await page.goto('/admin/packages');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Gói VIP Thường').first()).toBeVisible({ timeout: 60000 });

      // Click edit button for package 1
      await page.locator('[data-testid="edit-package-btn-1"]').click();

      // Check if dialog is open with edit title (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Chỉnh sửa gói dịch vụ")')).toBeVisible();

      // Verify loaded values
      await expect(page.locator('[data-testid="package-name-input"]')).toHaveValue('Gói VIP Thường');
      await expect(page.locator('[data-testid="package-price-input"]')).toHaveValue('100000');

      // Edit name
      await page.locator('[data-testid="package-name-input"]').fill('Gói VIP Thường Cập Nhật');

      // Submit form
      await page.locator('[data-testid="package-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=thành công')).toBeVisible();
      await expect(page.locator('h2:has-text("Chỉnh sửa gói dịch vụ")')).not.toBeVisible();
    });
  });

  test.describe('Project Management Dialogs', () => {
    test.beforeEach(async ({ page }) => {
      // Mock project list API call
      await mockApi(page, '**/api/admin/projects**', 200, {
        data: [
          {
            id: 1,
            name: 'Khu Đô Thị E2E',
            slug: 'khu-do-thi-e2e',
            min_price: 1000000000,
            max_price: 5000000000,
            location: 'Thành phố Quảng Ngãi',
            category: 'Đất nền',
            investor: 'Tập đoàn E2E',
            status: 'published',
          },
        ],
        links: {
          first: 'http://localhost:8000/api/admin/projects?page=1',
          last: 'http://localhost:8000/api/admin/projects?page=1',
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
      }, 'GET');
    });

    test('should open create dialog, fill details, and submit successfully', async ({ page }) => {
      // Mock create project API call
      await mockApi(page, '**/api/admin/projects', 200, {
        success: true,
        data: {
          id: 2,
          name: 'Dự Án Đầm Sen Quảng Ngãi',
          slug: 'du-an-dam-sen-quang-ngai',
          min_price: 2000000000,
          max_price: 8000000000,
          location: 'Mộ Đức, Quảng Ngãi',
          category: 'Khu dân cư',
          investor: 'Nam Hải Group',
          status: 'published',
        },
      }, 'POST');

      await page.goto('/admin/projects');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Khu Đô Thị E2E').first()).toBeVisible({ timeout: 60000 });

      // Click "Thêm dự án mới" button
      await page.locator('[data-testid="create-project-btn"]').click();

      // Check if dialog is open (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Thêm dự án mới")')).toBeVisible({ timeout: 15000 });

      // Fill form values
      await page.locator('[data-testid="project-name-input"]').fill('Dự Án Đầm Sen Quảng Ngãi');
      await page.locator('[data-testid="project-slug-input"]').fill('du-an-dam-sen-quang-ngai');
      await page.locator('[data-testid="project-min-price-input"]').fill('2000000000');
      await page.locator('[data-testid="project-max-price-input"]').fill('8000000000');
      await page.locator('[data-testid="project-location-input"]').fill('Mộ Đức, Quảng Ngãi');
      await page.locator('[data-testid="project-category-input"]').fill('Khu dân cư');
      await page.locator('[data-testid="project-investor-input"]').fill('Nam Hải Group');

      // Submit form
      await page.locator('[data-testid="project-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=thành công')).toBeVisible();
      // Wait for URL transition back to list page since projects are now full pages
      await page.waitForURL('**/admin/projects');
      await expect(page.locator('h2:has-text("Thêm dự án mới")')).not.toBeVisible();
    });

    test('should open edit dialog, load current details, and edit successfully', async ({ page }) => {
      // Mock edit project API call
      await mockApi(page, '**/api/admin/projects/1', 200, {
        success: true,
        data: {
          id: 1,
          name: 'Khu Đô Thị E2E Cập Nhật',
          slug: 'khu-do-thi-e2e-cap-nhat',
          min_price: 1500000000,
          max_price: 6000000000,
          location: 'Thành phố Quảng Ngãi',
          category: 'Đất nền biệt thự',
          investor: 'Tập đoàn E2E',
          status: 'published',
        },
      }, 'PUT');

      await mockApi(page, '**/api/admin/projects/1', 200, {
        success: true,
        data: {
          project: {
            id: 1,
            name: 'Khu Đô Thị E2E',
            slug: 'khu-do-thi-e2e',
            min_price: 1000000000,
            max_price: 5000000000,
            location: 'Thành phố Quảng Ngãi',
            category: 'Đất nền',
            investor: 'Tập đoàn E2E',
            status: 'published',
          },
          stats: {},
        }
      }, 'GET');

      await page.goto('/admin/projects');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Khu Đô Thị E2E').first()).toBeVisible({ timeout: 60000 });

      // Click the row actions button (three dots) to open menu
      const actionBtn = page.locator('table tbody tr').first().locator('button').first();
      await actionBtn.click();

      // Click "Chỉnh sửa dự án" in dropdown
      const editBtn = page.locator('[data-testid="edit-project-btn-1"]');
      try {
        await expect(editBtn).toBeVisible({ timeout: 2000 });
      } catch (e) {
        // Retry opening dropdown if click registered before component attached handlers
        await actionBtn.click();
        await expect(editBtn).toBeVisible({ timeout: 5000 });
      }
      await editBtn.click();

      // Check if dialog is open with edit title (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Chỉnh sửa dự án")')).toBeVisible({ timeout: 15000 });

      // Verify loaded values
      await expect(page.locator('[data-testid="project-name-input"]')).toHaveValue('Khu Đô Thị E2E');
      await expect(page.locator('[data-testid="project-min-price-input"]')).toHaveValue('1000000000');

      // Change field
      await page.locator('[data-testid="project-name-input"]').fill('Khu Đô Thị E2E Cập Nhật');

      // Submit form
      await page.locator('[data-testid="project-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=thành công')).toBeVisible();
      // Wait for URL transition back to list page since projects are now full pages
      await page.waitForURL('**/admin/projects');
      await expect(page.locator('h2:has-text("Chỉnh sửa dự án")')).not.toBeVisible();
    });
  });

  test.describe('User Management Dialogs', () => {
    test.beforeEach(async ({ page }) => {
      // Mock users list API call
      await mockApi(page, '**/api/admin/users**', 200, {
        data: [
          {
            id: 1,
            name: 'Lê Hoài Nam',
            email: 'hoainam.moducland@gmail.com',
            phone: '0914 234 567',
            avatar: null,
            role: 'agent',
            status: 'active',
            total_listings: 45,
            created_at: '2025-06-15T10:00:00Z',
          },
        ],
        links: {
          first: 'http://localhost:8000/api/admin/users?page=1',
          last: 'http://localhost:8000/api/admin/users?page=1',
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
      }, 'GET');
    });

    test('should open create dialog, fill details, and submit successfully', async ({ page }) => {
      // Mock create user API call
      await mockApi(page, '**/api/admin/users', 200, {
        success: true,
        data: {
          id: 2,
          name: 'Nguyễn Văn Đạt',
          email: 'vandat.diaoc@gmail.com',
          phone: '0935 443 311',
          avatar: null,
          role: 'agent',
          status: 'active',
          total_listings: 0,
          created_at: '2026-05-22T00:00:00Z',
        },
      }, 'POST');

      await page.goto('/admin/users');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Lê Hoài Nam').first()).toBeVisible({ timeout: 60000 });

      // Click "Thêm tài khoản mới" button
      await page.locator('[data-testid="create-user-btn"]').click();

      // Check if dialog is open (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Thêm tài khoản mới")')).toBeVisible();

      // Fill form values
      await page.locator('[data-testid="user-name-input"]').fill('Nguyễn Văn Đạt');
      await page.locator('[data-testid="user-phone-input"]').fill('0935443311');
      await page.locator('[data-testid="user-email-input"]').fill('vandat.diaoc@gmail.com');
      await page.locator('[data-testid="user-password-input"]').fill('123456');

      // Select role and status triggers
      await page.locator('[data-testid="user-role-select"]').click();
      await page.locator('role=option[name="Môi giới / Đại lý"]').click();

      await page.locator('[data-testid="user-status-select"]').click();
      await page.locator('role=option[name="Hoạt động"]').click();

      // Submit form
      await page.locator('[data-testid="user-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=thành công')).toBeVisible();
      await expect(page.locator('h2:has-text("Thêm tài khoản mới")')).not.toBeVisible();
    });

    test('should open edit dialog, load current details, and edit successfully', async ({ page }) => {
      // Mock edit user API call
      await mockApi(page, '**/api/admin/users/1', 200, {
        success: true,
        data: {
          id: 1,
          name: 'Lê Hoài Nam Cập Nhật',
          email: 'hoainam.moducland@gmail.com',
          phone: '0914 234 567',
          avatar: null,
          role: 'agent',
          status: 'active',
          total_listings: 45,
          created_at: '2025-06-15T10:00:00Z',
        },
      }, 'PUT');

      await page.goto('/admin/users');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Lê Hoài Nam').first()).toBeVisible({ timeout: 60000 });

      // Click the row actions button (three dots) to open menu
      const actionBtn = page.locator('table tbody tr').first().locator('button').last();
      await actionBtn.click();

      // Click "Chỉnh sửa thông tin" in dropdown
      await page.locator('[data-testid="edit-user-btn-1"]').click();

      // Check if dialog is open with edit title (use unambiguous heading check)
      await expect(page.locator('h2:has-text("Chỉnh sửa tài khoản")')).toBeVisible();

      // Verify loaded values
      await expect(page.locator('[data-testid="user-name-input"]')).toHaveValue('Lê Hoài Nam');
      await expect(page.locator('[data-testid="user-phone-input"]')).toHaveValue('0914 234 567');

      // Change field
      await page.locator('[data-testid="user-name-input"]').fill('Lê Hoài Nam Cập Nhật');

      // Submit form
      await page.locator('[data-testid="user-submit-btn"]').click();

      // Verify success toast
      await expect(page.locator('text=thành công')).toBeVisible();
      await expect(page.locator('h2:has-text("Chỉnh sửa tài khoản")')).not.toBeVisible();
    });

    test('should open view dialog, display user details correctly, and navigate to edit', async ({ page }) => {
      await page.goto('/admin/users');

      // Wait for table data to hydrate first
      await expect(page.locator('text=Lê Hoài Nam').first()).toBeVisible({ timeout: 60000 });

      // Click the row actions button (three dots) to open menu
      const actionBtn = page.locator('table tbody tr').first().locator('button').last();
      await actionBtn.click();

      // Click "Xem nhanh thông tin" in dropdown
      await page.locator('[data-testid="view-user-btn-1"]').click();

      // Check if dialog is open (use unambiguous test-id check)
      await expect(page.locator('[data-testid="view-user-dialog"]')).toBeVisible();

      // Verify shown details inside the dialog
      await expect(page.locator('[data-testid="view-user-dialog"] h4')).toHaveText('Lê Hoài Nam');
      await expect(page.locator('[data-testid="view-user-dialog"]')).toContainText('hoainam.moducland@gmail.com');
      await expect(page.locator('[data-testid="view-user-dialog"]')).toContainText('45 tin');

      // Click Edit button in the view dialog
      await page.locator('[data-testid="view-user-edit-btn"]').click();

      // View dialog should be closed and Edit dialog should open
      await expect(page.locator('[data-testid="view-user-dialog"]')).not.toBeVisible();
      await expect(page.locator('h2:has-text("Chỉnh sửa tài khoản")')).toBeVisible();
    });
  });
});
