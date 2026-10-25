import { expect, test, type Page } from '@playwright/test'

/** Phase 6: Methodology & Data, plus the full demo tour end to end. */

async function ready(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 })
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('method tab explains target, models, features, blind spot and data reality', async ({ page }) => {
  await page.goto('/methodology')
  await ready(page)
  await expect(page.getByRole('tab', { name: 'Method', selected: true })).toBeVisible()
  for (const heading of ['What ResilientEpi forecasts', 'How the forecast is made', 'What goes into the model', 'How the model is checked', 'The blind-spot indicator (experimental)', 'Data reality', 'Glossary']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
  // Also in the glossary; the first match is the method text.
  await expect(page.getByText('75th percentile', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Expected vs reported gap' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '35%' })).toBeVisible()
  await expect(page.getByText('HMIS district-month data ends in 2022, so the district model is retrospective.')).toBeVisible()
  // The three blind-spot validation tests: plan only, each "Planned — not yet run", no results.
  const plan = page.getByRole('list', { name: 'Blind-spot validation plan' })
  await expect(plan.getByRole('listitem')).toHaveCount(3)
  for (const name of ['Synthetic test', 'External check against serosurveys', 'Stability check']) {
    await expect(plan.getByRole('listitem').filter({ hasText: name })).toContainText('Planned — not yet run')
  }
  await expect(plan).toContainText('ICMR dengue serosurvey seroprevalence')
  await expect(plan).toContainText('±20%')
  await expect(plan).not.toContainText(/result|passed|failed/i)
})

test('model results: "Validation pending" and no accuracy figures', async ({ page }) => {
  await page.goto('/methodology')
  await ready(page)
  await page.getByRole('tab', { name: 'Model results' }).click()
  await expect(page).toHaveURL(/tab=results/)
  const panel = page.getByRole('tabpanel', { name: 'Model results' })
  await expect(panel.getByRole('status')).toContainText('Validation pending — results will appear after the backtest is run.')
  await expect(panel.getByText('Not yet evaluated')).toHaveCount(2)
  // No results tables or charts in demo mode.
  await expect(panel.getByRole('table')).toHaveCount(0)
  await expect(panel.locator('svg.recharts-surface')).toHaveCount(0)
  // No accuracy-like numbers at all: no percentages, no decimals.
  const text = (await panel.textContent()) ?? ''
  expect(text).not.toMatch(/%/)
  expect(text).not.toMatch(/\d\.\d/)
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Method', selected: true })).toBeVisible()
})

test('Back works after changing filters and tabs, one step per change (no duplicate history)', async ({ page }) => {
  // Methodology tabs: two changes → two Backs.
  await page.goto('/methodology')
  await ready(page)
  await page.getByRole('tab', { name: 'Model results' }).click()
  await page.getByRole('tab', { name: 'Data sources' }).click()
  await expect(page).toHaveURL(/tab=sources/)
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Model results', selected: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Method', selected: true })).toBeVisible()
  await expect(page).not.toHaveURL(/tab=/)

  // Risk Map horizon: 1M → 2M → 3M, then Back twice.
  await page.goto('/map?view=table')
  await ready(page)
  await page.getByRole('radio', { name: '2 months ahead' }).click()
  await page.getByRole('radio', { name: '2 months ahead' }).click() // re-clicking the active option is a no-op
  await page.getByRole('radio', { name: '3 months ahead' }).click()
  await expect(page).toHaveURL(/h=3/)
  await page.goBack()
  await expect(page).toHaveURL(/h=2/)
  await expect(page.getByRole('radio', { name: '2 months ahead' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('Forecast risk, 2 months ahead')).toBeVisible()
  await page.goBack()
  await expect(page).not.toHaveURL(/h=/)
  await expect(page.getByRole('radio', { name: '1 month ahead' })).toHaveAttribute('aria-checked', 'true')
})

test('data sources: type tag, status, last update, coverage and warnings for each', async ({ page }) => {
  await page.goto('/methodology?tab=sources')
  await ready(page)
  const list = page.getByRole('list', { name: 'Data sources' })
  await expect(list.getByRole('listitem').filter({ has: page.getByRole('heading') })).toHaveCount(7)
  const boundaries = list.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'District boundaries (map)' }) })
  await expect(boundaries).toContainText('Census 2011 districts, 12 demo states')
  const notes = boundaries.getByRole('list', { name: 'Warnings for District boundaries (map)' })
  await expect(notes).toContainText('Census 2011 district boundaries are used')
  await expect(notes).toContainText('Darjeeling: the 2011 shape still includes Kalimpong, which became a separate district in 2017.')
  await expect(notes).toContainText('Medchal–Malkajgiri: no 2011 boundary (district created 2016)')
  for (const tag of ['Synthetic demo', 'Imported historical', 'Live', 'Delayed']) {
    await expect(list.getByText(tag, { exact: true }).first()).toBeVisible()
  }
  const hmis = list.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'HMIS' }) })
  await expect(hmis).toContainText('Not connected (demo)')
  await expect(hmis).toContainText('Jan 2018 – Dec 2022')
  await expect(hmis.getByRole('list', { name: 'Warnings for HMIS' })).toContainText('ends in 2022')
  const demo = list.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'ResilientEpi demo generator' }) })
  await expect(demo).toContainText('Available')
})

test('demo tour runs from start to finish', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Demo tour' }).click()
  const tour = page.getByRole('complementary', { name: 'Demo tour' })
  const go = () => tour.getByRole('button', { name: 'Go' }).click()
  const next = () => tour.getByRole('button', { name: 'Next' }).click()

  // 1. Overview
  await go()
  await expect(page.getByRole('heading', { name: 'Needs attention this month' })).toBeVisible()
  await next()

  // 2. Risk map: Madurai's panel with its top reasons
  await go()
  await expect(page).toHaveURL(/\/map\?h=2&focus=tn-madurai&district=tn-madurai/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Madurai' })).toBeVisible()
  await expect(page.getByRole('dialog').getByText('Top reasons')).toBeVisible()
  await page.keyboard.press('Escape')
  await next()

  // 3. Blind-spot analysis: Kalaburagi's entry with its evidence
  await go()
  const entry = page.locator('article').filter({ has: page.getByRole('heading', { name: /Kalaburagi/ }) })
  await expect(entry).toBeVisible()
  await expect(entry.getByText('Evidence behind the alert')).toBeVisible()
  await next()

  // 4. Action Centre: assign Madurai's task, then mark it In Progress
  await go()
  const task = page.locator('article#act-tn-madurai-matrix')
  await task.getByRole('button', { name: 'Assign' }).click()
  await page.getByRole('alertdialog').getByLabel('Assign to').fill('Rapid Response Team 2')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Assign' }).click()
  await expect(task.getByText('Rapid Response Team 2', { exact: true })).toBeVisible()
  await task.getByRole('button', { name: 'Mark In Progress' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Mark In Progress' }).click()
  await expect(task.locator('header').getByText('In Progress', { exact: true })).toBeVisible()
  await next()

  // 5. Reports: Hindi bulletin preview
  await go()
  await expect(page.getByRole('article', { name: 'डेंगू जोखिम बुलेटिन — Madurai' })).toBeVisible()
  await tour.getByRole('button', { name: 'Finish' }).click()
  await expect(tour).toHaveCount(0)
})

test('tour card stays clickable above the open district panel', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Demo tour' }).click()
  // While the modal panel is open the tour is aria-hidden, so use mouse clicks like a presenter would.
  await page.locator('aside[aria-label="Demo tour"]').getByText('Next').click()
  await page.locator('aside[aria-label="Demo tour"]').getByText('Go').click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Madurai' })).toBeVisible()
  // A mouse click on Next works while the modal panel is open (it closes the panel).
  await page.locator('aside[aria-label="Demo tour"]').getByText('Next').click()
  await expect(page.locator('aside[aria-label="Demo tour"]')).toContainText('Step 3 of 5')
})
