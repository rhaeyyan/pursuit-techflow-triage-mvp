import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal e2e config: exercises the Vite dev server directly (no backend
 * required) since the tested flows — demo dataset load, ticket table
 * render/expand, status save, AI response draft — all have a deterministic
 * client-side path when the FastAPI backend is unreachable (see
 * `frontend/src/lib/fallbackResponseTemplate.ts` and `useTicketEdits`'s
 * catch-branch behavior).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
