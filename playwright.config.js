import { defineConfig, devices } from "@playwright/test";

const viewportTablet = { width: 1024, height: 1366 };
const viewportPhone = { width: 390, height: 844 };

export default defineConfig({
  testDir: "tests",
  timeout: 180000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173/WingsCrew-Color-Adventures/",
    serviceWorkers: "allow",
  },
  webServer: {
    command: "node tools/serve.mjs",
    url: "http://127.0.0.1:4173/WingsCrew-Color-Adventures/",
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: "tablet-chromium",
      use: { ...devices["Desktop Chrome"], viewport: viewportTablet, deviceScaleFactor: 1 },
    },
    {
      name: "phone-chromium",
      use: { ...devices["Desktop Chrome"], viewport: viewportPhone, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: "tablet-webkit",
      use: { ...devices["Desktop Safari"], viewport: viewportTablet, deviceScaleFactor: 1 },
    },
  ],
});
