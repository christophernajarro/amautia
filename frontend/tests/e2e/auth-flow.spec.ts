import { test, expect, Page } from "@playwright/test";

// Base-ui buttons require dispatchEvent for Playwright clicks to trigger React handlers
async function clickButton(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    if (btn) btn.click();
  }, selector);
}

async function clickButtonByText(page: Page, text: string) {
  await page.evaluate((t) => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent?.trim() === t);
    if (btn) btn.click();
  }, text);
}

async function clickLinkByText(page: Page, text: string) {
  await page.evaluate((t) => {
    const links = Array.from(document.querySelectorAll("a"));
    const link = links.find((a) => a.textContent?.trim() === t);
    if (link) link.click();
  }, text);
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.waitForTimeout(200);
  await clickButton(page, 'button[type="submit"]');
}

test.describe("Amautia - Auth Flow", () => {
  test("landing page loads correctly", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await expect(page.locator("text=Amautia")).toBeVisible();
    await expect(page.locator("text=Corrige exámenes en")).toBeVisible();
    await expect(page.locator("text=Empieza gratis")).toBeVisible();
    await expect(page.locator("text=Iniciar sesión")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("text=Inicia sesión en tu cuenta")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("quick access buttons fill credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.waitForSelector('input[type="email"]');

    // Click "Admin" quick access button via JS
    await clickButtonByText(page, "Admin");
    await page.waitForTimeout(300);
    await expect(page.locator("input[type='email']")).toHaveValue("admin@amautia.com");
    await expect(page.locator("input[type='password']")).toHaveValue("admin123");
  });

  test("login as admin redirects to admin dashboard", async ({ page }) => {
    await loginAs(page, "admin@amautia.com", "admin123");
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page.locator("h1:has-text('Panel de Administración')")).toBeVisible();
  });

  test("login as profesor redirects to profesor dashboard", async ({ page }) => {
    await loginAs(page, "profesor@amautia.com", "profesor123");
    await page.waitForURL("**/profesor", { timeout: 10000 });
    await expect(page.locator("text=Bienvenido a tu panel de profesor")).toBeVisible();
  });

  test("login as alumno redirects to alumno dashboard", async ({ page }) => {
    await loginAs(page, "alumno@amautia.com", "alumno123");
    await page.waitForURL("**/alumno", { timeout: 10000 });
    await expect(page.locator("h1:has-text('Mi Dashboard')")).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/registro");
    await expect(page.locator("text=Crea tu cuenta")).toBeVisible();
  });
});

test.describe("Amautia - Admin Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin@amautia.com", "admin123");
    await page.waitForURL("**/admin", { timeout: 10000 });
  });

  test("admin can navigate to all sections", async ({ page }) => {
    // Usuarios
    await clickLinkByText(page, "Usuarios");
    await page.waitForURL("**/admin/usuarios");
    await expect(page.locator("h1:has-text('Usuarios')")).toBeVisible();

    // Pagos
    await clickLinkByText(page, "Pagos");
    await page.waitForURL("**/admin/pagos");
    await expect(page.locator("h1:has-text('Verificación de Pagos')")).toBeVisible();

    // Planes
    await clickLinkByText(page, "Planes");
    await page.waitForURL("**/admin/planes");
    await expect(page.locator("h1:has-text('Planes')")).toBeVisible();

    // IA Config
    await clickLinkByText(page, "Configuración IA");
    await page.waitForURL("**/admin/ia");
    await expect(page.locator("h1:has-text('Configuración de IA')")).toBeVisible();
  });
});

test.describe("Amautia - Profesor Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "profesor@amautia.com", "profesor123");
    await page.waitForURL("**/profesor", { timeout: 10000 });
  });

  test("profesor can navigate to all sections", async ({ page }) => {
    // Materias
    await clickLinkByText(page, "Materias");
    await page.waitForURL("**/profesor/materias");
    await expect(page.locator("h1:has-text('Mis Materias')")).toBeVisible();

    // Alumnos
    await clickLinkByText(page, "Alumnos");
    await page.waitForURL("**/profesor/alumnos");
    await expect(page.locator("h1:has-text('Mis Alumnos')")).toBeVisible();

    // Exámenes
    await clickLinkByText(page, "Exámenes");
    await page.waitForURL("**/profesor/examenes");
    await expect(page.locator("h1:has-text('Mis Exámenes')")).toBeVisible();

    // Generar
    await clickLinkByText(page, "Generar Examen");
    await page.waitForURL("**/profesor/generar");
    await expect(page.locator("h1:has-text('Generar Examen')")).toBeVisible();
  });
});

test.describe("Amautia - Alumno Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "alumno@amautia.com", "alumno123");
    await page.waitForURL("**/alumno", { timeout: 10000 });
  });

  test("alumno can navigate to all sections", async ({ page }) => {
    // Materias
    await clickLinkByText(page, "Materias");
    await page.waitForURL("**/alumno/materias");
    await expect(page.locator("h1:has-text('Mis Materias')")).toBeVisible();

    // Exámenes
    await clickLinkByText(page, "Mis Exámenes");
    await page.waitForURL("**/alumno/examenes");
    await expect(page.locator("h1:has-text('Mis Exámenes')")).toBeVisible();

    // Tutor IA
    await clickLinkByText(page, "Tutor IA");
    await page.waitForURL("**/alumno/tutor");
    await expect(page.locator("h1:has-text('Tutor IA')")).toBeVisible();

    // Progreso
    await clickLinkByText(page, "Mi Progreso");
    await page.waitForURL("**/alumno/progreso");
    await expect(page.locator("h1:has-text('Mi Progreso')")).toBeVisible();
  });
});
