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
  await page.route('**/geo/india_districts.*', (r) => r.fulfill({ status: 404, body: '' }))
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
  await expect(page.locator('.leaflet-container')).toBeVisible()
})

const BS_LABEL = 'Experimental surveillance blind-spot indicator — not proof of under-reporting.'

test('every blind-spot entry and every review dialog carries the experimental label', async ({ page }) => {
  await page.goto('/blind-spots')
  await ready(page)
  const entries = page.locator('article')
  const n = await entries.count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) await expect(entries.nth(i).getByText(BS_LABEL)).toBeVisible()

  const first = entries.first()
  for (const decision of ['Acknowledge', 'Flag for audit', 'Dismiss']) {
    await first.getByRole('button', { name: decision, exact: true }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText(BS_LABEL)).toBeVisible()
    await expect(dialog.getByText('Experimental', { exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)
  }
})

test('blind-spot review: reason validation, confirm, history line, persists, evaluator read-only', async ({ page }) => {
  await page.goto('/blind-spots?focus=ka-kalaburagi')
  await ready(page)
  const entry = page.locator('article').filter({ has: page.getByRole('heading', { name: /Kalaburagi/ }) })
  await entry.getByRole('button', { name: 'Flag for audit', exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByLabel('Reason (optional)').fill('x'.repeat(501))
  await dialog.getByRole('button', { name: 'Flag for audit' }).click()
  await expect(dialog.getByText('Keep the reason under 500 characters')).toBeVisible()
  await dialog.getByLabel('Reason (optional)').fill('Testing camp scheduled; audit lab registers')
  await dialog.getByRole('button', { name: 'Flag for audit' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Flagged for audit: Kalaburagi' })).toBeVisible()
  const history = entry.getByRole('list', { name: 'Review history for Kalaburagi' })
  await expect(history).toContainText('Flagged for audit · Demo District Officer (District Officer)')
  await expect(history).toContainText('“Testing camp scheduled; audit lab registers”')

  await page.reload()
  await ready(page)
  await expect(page.getByRole('list', { name: 'Review history for Kalaburagi' })).toContainText('Flagged for audit')

  await page.getByRole('button', { name: /Profile/ }).click()
  await page.getByRole('menuitemradio', { name: 'Evaluator' }).click()
  await expect(entry.getByRole('button', { name: 'Acknowledge', exact: true })).toBeDisabled()
})

test('blind spots: empty state per state offers a next step', async ({ page }) => {
  await page.goto('/blind-spots?state=Kerala')
  await ready(page)
  await expect(page.getByText('No blind spots in this state. Try another state.')).toBeVisible()
  await page.getByRole('button', { name: 'Show all states' }).click()
  await expect(page).not.toHaveURL(/state=Kerala/)
  await expect(page.locator('article').first()).toBeVisible()
})

/** The matrix task of a district on the Action Centre. */
const matrixTask = (page: Page, districtId: string) => page.locator(`article#act-${districtId}-matrix`)

test('action centre: tour story — assign Madurai’s P1 task, then mark it In Progress', async ({ page }) => {
  await page.goto('/actions?dist=tn-madurai')
  await ready(page)
  await expect(page.getByRole('note').filter({ hasText: 'Recommendations need human review and approval. ResilientEpi does not start interventions.' })).toBeVisible()
  const task = matrixTask(page, 'tn-madurai')
  await expect(task.getByLabel(/^Priority P1/)).toBeVisible()

  await task.getByRole('button', { name: 'Assign' }).click()
  let dialog = page.getByRole('alertdialog')
  await dialog.getByLabel('Assign to').fill('Rapid Response Team 2')
  await dialog.getByRole('button', { name: 'Assign' }).click()
  await expect(task.getByText('Rapid Response Team 2', { exact: true })).toBeVisible()
  await expect(task.getByRole('list', { name: /History for Madurai/ })).toContainText('Assigned to Rapid Response Team 2 · Demo District Officer (District Officer)')

  await task.getByRole('button', { name: 'Mark In Progress' }).click()
  dialog = page.getByRole('alertdialog')
  await dialog.getByRole('button', { name: 'Mark In Progress' }).click()
  await expect(task.getByRole('list', { name: /History for Madurai/ })).toContainText('Status Pending → In Progress')
  await expect(task.locator('header').getByText('In Progress', { exact: true })).toBeVisible()
})

test('action centre: Completed requires a short note', async ({ page }) => {
  await page.goto('/actions?dist=ka-kalaburagi')
  await ready(page)
  const task = matrixTask(page, 'ka-kalaburagi')
  await task.getByRole('button', { name: 'Mark Completed' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByRole('button', { name: 'Mark Completed' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Add a short note on what was done before marking it completed')
  await dialog.getByLabel('What was done? (required)').fill('Audited lab registers with DSU')
  await dialog.getByRole('button', { name: 'Mark Completed' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(task.locator('header').getByText('Completed', { exact: true })).toBeVisible()
  await expect(task.getByText('Audited lab registers with DSU')).toBeVisible()
})

test('action centre: watch band gets a P3 verify task; generated tasks never duplicate', async ({ page }) => {
  await page.goto('/actions')
  await ready(page)
  for (const id of ['up-gorakhpur', 'od-ganjam']) {
    const verify = page.locator(`article#act-${id}-verify`)
    await expect(verify.getByLabel(/^Priority P3/)).toBeVisible()
    await expect(verify.getByRole('heading')).toContainText('Verify data completeness')
  }
  const count = async () => Number((await page.getByRole('status').filter({ hasText: /^Showing/ }).textContent())!.match(/of (\d+)/)![1])
  const before = await count()
  await page.getByLabel('Priority').click()
  await page.getByRole('option', { name: /^P2/ }).click()
  await page.getByRole('button', { name: 'Clear all' }).click()
  await page.reload()
  await ready(page)
  expect(await count()).toBe(before)
  const ids = await page.locator('article[id^="act-"]').evaluateAll((els) => els.map((e) => e.id))
  expect(new Set(ids).size).toBe(ids.length)
})

test('action centre ↔ blind spots: Dismiss demotes to "no blind spot" with a note; Flag for audit creates one audit task', async ({ page }) => {
  await page.goto('/blind-spots?focus=tn-madurai')
  await ready(page)
  const madurai = page.locator('article').filter({ has: page.getByRole('heading', { name: /Madurai/ }) })
  await madurai.getByRole('button', { name: 'Dismiss', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Dismissed: Madurai' })).toBeVisible()

  const kalaburagi = page.locator('article').filter({ has: page.getByRole('heading', { name: /Kalaburagi/ }) })
  for (let i = 0; i < 2; i++) {
    await kalaburagi.getByRole('button', { name: 'Flag for audit', exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Flag for audit' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  }

  await page.goto('/actions?dist=tn-madurai')
  await ready(page)
  const task = matrixTask(page, 'tn-madurai')
  await expect(task.getByLabel(/^Priority P2/)).toBeVisible()
  await expect(task.getByText(/^Blind spot dismissed by District Officer, \d{1,2} \w{3} \d{4}$/)).toBeVisible()
  await expect(task.getByRole('list', { name: /History for Madurai/ })).toContainText('Recommendation updated P1 → P2: blind spot dismissed')

  await page.goto('/actions?dist=ka-kalaburagi')
  await ready(page)
  await expect(page.locator('article#act-ka-kalaburagi-audit')).toHaveCount(1)
  await expect(page.locator('article#act-ka-kalaburagi-audit').getByRole('heading')).toContainText('Audit testing and reporting')
})

test('action centre: evaluator is read-only', async ({ page }) => {
  await page.goto('/actions?dist=tn-madurai')
  await ready(page)
  await page.getByRole('button', { name: /Profile/ }).click()
  await page.getByRole('menuitemradio', { name: 'Evaluator' }).click()
  await expect(page.getByText('Read-only view (Evaluator)', { exact: false })).toBeVisible()
  const task = matrixTask(page, 'tn-madurai')
  await expect(task.getByRole('button', { name: 'Assign' })).toBeDisabled()
  await expect(task.getByRole('button', { name: 'Mark In Progress' })).toBeDisabled()
})
