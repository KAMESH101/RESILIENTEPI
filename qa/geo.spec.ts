import { expect, test } from '@playwright/test'

/**
 * Geographic-map checks against the committed boundary file. Set
 * BOUNDARY_FIXTURE to serve a different local file through a route instead.
 */
const fixture = process.env.BOUNDARY_FIXTURE

test.beforeEach(async ({ page }) => {
  if (fixture) await page.route('**/geo/india_districts.topojson', (route) => route.fulfill({ path: fixture, contentType: 'application/json' }))
})

const ATTRIBUTION = 'District boundaries © DataMeet (CC BY 2.5 IN) · indicative, not official'

for (const width of [375, 768, 1440]) {
  test(`geographic map @ ${width}px`, async ({ page }) => {
    const problems: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('React'))) problems.push(m.text().slice(0, 300))
    })
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    await page.goto('/map?view=map&h=2&focus=tn-madurai')
    await expect(page.locator('.leaflet-re-fills-pane path').first()).toBeAttached({ timeout: 15_000 })
    await expect(page.locator('.leaflet-control-attribution')).toHaveText(ATTRIBUTION)
    await page.waitForTimeout(900) // flyToBounds
    await page.screenshot({ path: `qa/screenshots/geo-map-${width}.png`, fullPage: true })
    await page.goto('/')
    await expect(page.locator('.leaflet-re-fills-pane path').first()).toBeAttached({ timeout: 15_000 })
    await page.screenshot({ path: `qa/screenshots/geo-overview-${width}.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    expect(problems).toEqual([])
  })
}

test('no district outline is stroked; only inner borders are drawn as lines', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/map?view=map&focus=gj-surat')
  const fills = page.locator('.leaflet-re-fills-pane path')
  await expect(fills.first()).toBeAttached({ timeout: 15_000 })
  expect(await fills.count()).toBeGreaterThan(300)
  const stroked = await page.locator('.leaflet-re-fills-pane path, .leaflet-re-hatch-pane path').evaluateAll((els) => els.filter((e) => (e.getAttribute('stroke') ?? 'none') !== 'none').length)
  expect(stroked, 'fills and hatch overlay must have no stroke').toBe(0)
  await expect(page.locator('.leaflet-re-lines-pane path').first()).toBeAttached()
  // Focus is shown with a pin, not an outline.
  await expect(page.locator('.re-pin')).toHaveCount(1)
})

test('clicking a district shape opens the shared panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/map?view=map&focus=tn-madurai')
  await expect(page.locator('.leaflet-re-fills-pane path').first()).toBeAttached({ timeout: 15_000 })
  await page.waitForTimeout(900)
  // Madurai is centred by the focus zoom.
  const box = (await page.locator('.leaflet-container').first().boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Madurai' })).toBeVisible()
})

test('Medchal–Malkajgiri is in the table and panel with its note, not on the map', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/map?view=table&state=Telangana')
  const row = page.getByRole('row').filter({ hasText: 'Medchal–Malkajgiri' })
  await expect(row.getByText('No 2011 boundary (district created 2016)')).toBeVisible()
  await row.getByRole('button').first().click()
  await expect(page.getByRole('dialog').getByText('No 2011 boundary (district created 2016) — not drawn on the map.')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('radio', { name: 'Map' }).click()
  await expect(page.getByText('Not drawn: Medchal–Malkajgiri — No 2011 boundary (district created 2016). Shown in the table only.')).toBeVisible()
})
