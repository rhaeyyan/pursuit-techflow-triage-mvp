import { test, expect } from '@playwright/test';

/**
 * Covers the presentation code touched by the recent refactor/name change:
 * App.tsx (demo load), TicketTable.tsx + its extracted hook/lib modules
 * (useTicketEdits, ticketsApi, fallbackResponseTemplate, ticketFormatters).
 *
 * Runs against the Vite dev server only — no FastAPI backend. The status
 * save and AI-draft calls are expected to fail (connection refused to
 * localhost:8000) and fall through to their deterministic client-side
 * fallback paths, which is itself the behavior under test.
 */
test('load demo tickets, edit status, save, and draft a fallback AI response', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Load Demo Dataset' }).click();

  const table = page.locator('table');
  await expect(table).toBeVisible();

  const firstRow = table.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();

  // Expand the row to reveal the save/discard/draft controls.
  await firstRow.locator('td').first().click();

  const statusSelect = firstRow.getByRole('combobox');
  await expect(statusSelect).toBeVisible();
  const currentStatus = await statusSelect.inputValue();
  const targetStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
  await statusSelect.selectOption(targetStatus);

  const updateButton = page.getByRole('button', { name: 'Update Ticket' });
  await expect(updateButton).toBeVisible();
  await updateButton.click();
  await expect(page.getByText('Ticket Updated!')).toBeVisible();

  await page.getByRole('button', { name: 'Draft AI Response' }).click();
  await expect(page.getByText(/Smart Template/)).toBeVisible();
});
