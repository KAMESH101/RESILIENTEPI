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
  // Only the specified validation test is listed; the rest are explicitly pending.
  await expect(page.getByText('still to be specified by the team', { exact: false })).toBeVisible()
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
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Method', selected: true })).toBeVisible()
})

test('data sources: type tag, status, last update, coverage and warnings for each', async ({ page }) => {
  await page.goto('/methodology?tab=sources')
  await ready(page)
  const list = page.getByRole('list', { name: 'Data sources' })
  await expect(list.getByRole('listitem').filter({ has: page.getByRole('heading') })).toHaveCount(6)
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
