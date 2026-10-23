import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/** Phase 5: District Detail and Reports & Bulletins. */

async function ready(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 })
}

const DISCLAIMER_EN = 'Demonstration bulletin — not an official government communication.'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

/* ------------------------------------------------------------------ */
/* District Detail                                                     */
/* ------------------------------------------------------------------ */

test('Darjeeling: missing months render as gaps (null), never zero', async ({ page }) => {
  await page.goto('/district/wb-darjeeling')
  await ready(page)
  const chart = page.getByRole('figure', { name: /Historical reported cases/ })
  // A gap splits the line into several sub-paths ("M" commands) instead of dropping to 0.
  const d = await chart.locator('path.recharts-line-curve').first().getAttribute('d')
  expect((d!.match(/M/g) ?? []).length).toBeGreaterThan(1)

  await chart.getByRole('button', { name: 'View as table' }).click()
  const rows = chart.getByRole('row')
  for (const month of ['Sep 2026', 'Jun 2026', 'Mar 2026']) {
    await expect(rows.filter({ hasText: month })).toContainText('No data')
  }
  await expect(page.getByRole('list', { name: 'Months with no report' })).toContainText('Sep 2026')
  await expect(page.getByRole('list', { name: 'Months with no report' })).toContainText('Mar 2026')
})

test('Bathinda: low-confidence note and "Explanation not yet available"', async ({ page }) => {
  await page.goto('/district/pb-bathinda')
  await ready(page)
  await expect(page.getByRole('note').filter({ hasText: 'Low confidence: data 4 months old' })).toBeVisible()
  await expect(page.getByText('Explanation not yet available.')).toBeVisible()
})

test('Medchal–Malkajgiri works without a map shape', async ({ page }) => {
  await page.goto('/district/tg-medchal-malkajgiri')
  await ready(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Medchal–Malkajgiri' })).toBeVisible()
  await expect(page.getByText('No 2011 boundary (district created 2016) — not drawn on the map', { exact: false })).toBeVisible()
  await expect(page.getByRole('figure', { name: /Forecast vs actual cases/ })).toBeVisible()
})

test('forecast chart: one baseline at a time, no uncertainty band unless the data has one', async ({ page }) => {
  await page.goto('/district/tn-madurai?h=2')
  await ready(page)
  const chart = page.getByRole('figure', { name: /Forecast vs actual cases/ })
  await expect(chart.getByText('Baseline: Seasonal naive', { exact: true })).toBeVisible()
  await chart.getByRole('combobox', { name: 'Baseline' }).click()
  await page.getByRole('option', { name: /Persistence/ }).click()
  await expect(chart.getByText('Baseline: Persistence', { exact: true })).toBeVisible()
  await expect(chart.getByText('Baseline: Seasonal naive', { exact: true })).toHaveCount(0)
  // The mock forecasts carry no interval, so no band and no band legend.
  await expect(chart.getByText(/Forecast uncertainty/)).toHaveCount(0)
  await expect(chart.locator('.recharts-area')).toHaveCount(0)
  // Every chart has a date-range selector.
  expect(await page.getByRole('combobox', { name: /^Date range/ }).count()).toBeGreaterThanOrEqual(5)
})

/* ------------------------------------------------------------------ */
/* Bulletins                                                           */
/* ------------------------------------------------------------------ */

const LANGS = [
  { lang: 'en', title: 'Dengue risk bulletin — Madurai', translated: null },
  { lang: 'hi', title: 'डेंगू जोखिम बुलेटिन — Madurai', translated: 'प्रदर्शन बुलेटिन — आधिकारिक सरकारी संचार नहीं।' },
  { lang: 'ta', title: 'டெங்கு அபாய அறிக்கை — Madurai', translated: 'செயல்விளக்க அறிக்கை — அதிகாரப்பூர்வ அரசுத் தகவல் தொடர்பு அல்ல.' },
] as const

for (const L of LANGS) {
  test(`bulletin in ${L.lang}: disclaimer, review label, and facts from app data`, async ({ page }) => {
    await page.goto(`/reports?scope=district&target=tn-madurai&lang=${L.lang}`)
    await ready(page)
    const bulletin = page.getByRole('article', { name: L.title })
    await expect(bulletin).toBeVisible()
    const footer = bulletin.getByTestId('bulletin-footer')
    await expect(footer).toContainText(DISCLAIMER_EN)
    if (L.translated) {
      await expect(footer).toContainText(L.translated)
      await expect(bulletin.getByTestId('translation-pending')).toContainText('Translation pending review')
    } else {
      await expect(bulletin.getByTestId('translation-pending')).toHaveCount(0)
    }
    // Same number as the district page shows for the 1-month horizon.
    await expect(bulletin.getByRole('row').filter({ hasText: 'Madurai' }).first()).toContainText('62%')
    await expect(bulletin).toHaveAttribute('lang', L.lang)
  })
}

test('Hindi and Tamil fonts are bundled and actually load (no CDN)', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url())
  })
  await page.goto('/reports?scope=district&target=tn-madurai&lang=ta')
  await ready(page)
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))
  expect(loaded.some((f) => f.includes('Noto Sans Tamil'))).toBe(true)
  await page.goto('/reports?scope=district&target=tn-madurai&lang=hi')
  await ready(page)
  await page.evaluate(() => document.fonts.ready)
  const loadedHi = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))
  expect(loadedHi.some((f) => f.includes('Noto Sans Devanagari'))).toBe(true)
  expect(external).toEqual([])
})

test('print stylesheet: app chrome hidden, header and footer repeat, A4', async ({ page }) => {
  await page.goto('/reports?scope=national&lang=hi')
  await ready(page)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('navigation', { name: /Main navigation|मुख्य नेविगेशन/ })).toBeHidden()
  await expect(page.getByRole('combobox', { name: /Search district|ज़िला खोजें/ })).toBeHidden()
  const footer = page.getByTestId('bulletin-footer')
  await expect(footer).toBeVisible()
  await expect(footer).toContainText(DISCLAIMER_EN)
  const groups = await page.evaluate(() => {
    const frame = document.querySelector('.bulletin-frame')!
    return [getComputedStyle(frame.querySelector('thead')!).display, getComputedStyle(frame.querySelector('tfoot')!).display]
  })
  expect(groups).toEqual(['table-header-group', 'table-footer-group'])
  // A national bulletin spans several A4 pages; the PDF renders without error.
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  expect(pdf.byteLength).toBeGreaterThan(10_000)
})

test('tour step 5 deep link generates the Hindi bulletin preview', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Demo tour' }).click()
  const tour = page.getByRole('complementary', { name: 'Demo tour' })
  for (let i = 0; i < 4; i++) await tour.getByRole('button', { name: 'Next' }).click()
  await tour.getByRole('button', { name: 'Go' }).click()
  await expect(page.getByRole('article', { name: 'डेंगू जोखिम बुलेटिन — Madurai' })).toBeVisible()
})

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

async function downloadText(page: Page, button: RegExp): Promise<Buffer> {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: button }).click()])
  return readFileSync((await download.path())!)
}

test('bulletin CSV: UTF-8 BOM, Tamil and Hindi text intact, source column', async ({ page }) => {
  for (const [lang, header, category] of [
    ['ta', 'மாவட்டம்', 'அதிகம்'],
    ['hi', 'ज़िला', 'उच्च'],
  ] as const) {
    await page.goto(`/reports?scope=state&target=Tamil%20Nadu&lang=${lang}`)
    await ready(page)
    const bytes = await downloadText(page, /Bulletin data \(CSV\)/)
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const text = bytes.toString('utf8')
    const [head, ...lines] = text.replace(/^﻿/, '').trim().split('\r\n')
    expect(head!.startsWith(header)).toBe(true)
    expect(text).toContain(category)
    expect(head!.split(',').length).toBe(13)
    for (const l of lines) expect(l.endsWith(',synthetic')).toBe(true)
    expect(lines.some((l) => l.startsWith('Madurai,Tamil Nadu,'))).toBe(true)
  }
})

test('tasks CSV: formula-injection guard on cells starting with = + - @', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Create action' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Create action' })
  await dialog.getByLabel('Suggested action').fill('=1+1 check stock')
  await dialog.getByLabel('Reason (optional)').fill('@ward 7 report')
  await dialog.getByRole('button', { name: 'Review & create' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Create action' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Action created for Madurai' })).toBeVisible()

  await page.goto('/reports')
  await ready(page)
  const text = (await downloadText(page, /Action Centre tasks \(CSV\)/)).toString('utf8')
  expect(text.charCodeAt(0)).toBe(0xfeff)
  expect(text).toContain(",'=1+1 check stock,")
  expect(text).toContain(",'@ward 7 report,")
  expect(text).not.toMatch(/,=1\+1/)
  expect(text.split('\r\n')[0]).toContain('source')
})

test('all-districts CSV: 60 rows with source column', async ({ page }) => {
  await page.goto('/reports?h=2')
  await ready(page)
  const text = (await downloadText(page, /All districts, 2-month horizon \(CSV\)/)).toString('utf8')
  const lines = text.replace(/^﻿/, '').trim().split('\r\n')
  expect(lines).toHaveLength(61)
  expect(lines[0]!.endsWith(',source')).toBe(true)
  expect(lines.slice(1).every((l) => l.endsWith(',synthetic'))).toBe(true)
})
