import { expect, test, type Page } from '@playwright/test'

/** Behaviour checks: every Phase 1 control does something useful. */

async function ready(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 10_000 })
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('"/" focuses district search and selecting a district opens its page', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.keyboard.press('/')
  const search = page.getByRole('combobox', { name: 'Search district' })
  await expect(search).toBeFocused()
  await search.fill('madu')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/district\/tn-madurai/)
  await expect(page.getByRole('heading', { level: 1, name: 'Madurai' })).toBeVisible()
})

test('horizon and state filters live in the URL and the back button restores them', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('radio', { name: '3 months ahead' }).click()
  await expect(page).toHaveURL(/h=3/)
  await page.getByLabel('State').click()
  await page.getByRole('option', { name: 'Kerala' }).click()
  await expect(page).toHaveURL(/state=Kerala/)
  await expect(page.getByText('State: Kerala')).toBeVisible()
  await page.goBack()
  await expect(page).not.toHaveURL(/state=Kerala/)
  await expect(page).toHaveURL(/h=3/)
  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page).not.toHaveURL(/h=3/)
})

test('KPI cards open filtered views and keep filters', async ({ page }) => {
  await page.goto('/?h=2')
  await ready(page)
  await page.getByRole('link', { name: /High \/ Very High Risk Districts/ }).click()
  await expect(page).toHaveURL(/\/map\?h=2&risk=high/)
})

test('district panel opens from the table and links to the district page', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Open Surat details' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel.getByRole('heading', { name: 'Surat' })).toBeVisible()
  await expect(panel.getByText('Top reasons')).toBeVisible()
  await panel.getByRole('link', { name: 'Open district page' }).click()
  await expect(page).toHaveURL(/\/district\/gj-surat/)
})

test('create action: validate → confirm → toast → persisted in recommended actions', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Create action' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Create action' })
  await dialog.getByLabel('Suggested action').fill('')
  await dialog.getByRole('button', { name: 'Review & create' }).click()
  await expect(dialog.getByText('Describe the action')).toBeVisible()
  await dialog.getByLabel('Suggested action').fill('Send rapid testing team to Madurai wards')
  await dialog.getByLabel('Assign to (optional)').fill('Rapid Response Team 2')
  await dialog.getByRole('button', { name: 'Review & create' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Create action' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Action created for Madurai' })).toBeVisible()
  await expect(page.getByText('Demo mode: not sent to a real system', { exact: false })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await ready(page)
  await expect(page.getByText('Send rapid testing team to Madurai wards')).toBeVisible()
})

test('evaluator role is read-only; reset demo data restores the seed', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  // Make a change first so reset has something to clear.
  await page.getByRole('button', { name: 'Create action' }).first().click()
  await page.getByLabel('Suggested action').fill('Temporary demo action')
  await page.getByRole('button', { name: 'Review & create' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Create action' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Action created for Madurai' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Recommended actions' }).getByText('Temporary demo action')).toBeVisible()

  await page.getByRole('button', { name: /Profile/ }).click()
  await page.getByRole('menuitemradio', { name: 'Evaluator' }).click()
  await expect(page.getByRole('button', { name: 'Create action' }).first()).toBeDisabled()

  await page.getByRole('button', { name: /Profile/ }).click()
  await page.getByRole('menuitem', { name: 'Reset demo data' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Demo data reset' })).toBeVisible()
  await ready(page)
  await expect(page.getByText('Temporary demo action')).toHaveCount(0)
})

test('Hindi switch translates navigation and headings', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: /Language/ }).click()
  await page.getByRole('menuitemradio', { name: 'हिन्दी' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'भारत डेंगू निगरानी अवलोकन' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'कार्रवाई केंद्र' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
})

test('demo tour Go buttons navigate with the scripted filters', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Demo tour' }).click()
  const tour = page.getByRole('complementary', { name: 'Demo tour' })
  await tour.getByRole('button', { name: 'Next' }).click()
  await tour.getByRole('button', { name: 'Go' }).click()
  await expect(page).toHaveURL(/\/map\?h=2&focus=tn-madurai&district=tn-madurai/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Madurai' })).toBeVisible()
})

test('missing boundary file falls back to the labelled schematic view', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await expect(page.getByText('Boundary file not loaded.')).toBeVisible()
  await expect(page.getByText('Schematic view — not geographic')).toBeVisible()
  await page.getByRole('button', { name: /^Madurai, Tamil Nadu: High risk/ }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Madurai' })).toBeVisible()
})

test('risk map: KPI filter, table/map switch, search focus and layer toggles live in the URL', async ({ page }) => {
  await page.goto('/map?risk=high')
  await ready(page)
  await expect(page.getByText('Risk: High or Very High')).toBeVisible()
  await page.getByRole('radio', { name: 'Table' }).click()
  await expect(page).toHaveURL(/view=table/)
  const status = page.getByRole('status').filter({ hasText: /Showing \d+ of 60/ })
  const highCount = Number((await status.textContent())!.match(/Showing (\d+)/)![1])
  expect(highCount).toBeGreaterThan(0)
  expect(highCount).toBeLessThan(60)
  // Every visible row is High or Very High.
  const badges = page.locator('table tbody tr td:nth-child(2)')
  for (const text of await badges.allTextContents()) expect(text).toMatch(/High/)

  await page.getByRole('button', { name: 'Remove filter Risk: High or Very High' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Showing 60 of 60' })).toBeVisible()

  await page.getByRole('radio', { name: 'Map' }).click()
  await expect(page).toHaveURL(/view=map/)
  await page.getByRole('combobox', { name: 'Find a district' }).fill('Kalab')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/focus=ka-kalaburagi/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Kalaburagi' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).not.toHaveURL(/district=/)

  await page.getByRole('switch', { name: 'Blind-spot overlay' }).click()
  await expect(page).toHaveURL(/bs_layer=0/)
  await expect(page.getByRole('switch', { name: 'Blind-spot overlay' })).not.toBeChecked()
  await page.goBack()
  await expect(page.getByRole('switch', { name: 'Blind-spot overlay' })).toBeChecked()
})

test('risk map opens on the list first on mobile, with a Show map toggle', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/map')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Show map' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'District forecast risk' })).toBeVisible()
  await page.getByRole('button', { name: 'Show map' }).click()
  await expect(page).toHaveURL(/view=map/)
  await expect(page.getByText('Schematic view — not geographic')).toBeVisible()
})
