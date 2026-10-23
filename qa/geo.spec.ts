import { expect, test } from '@playwright/test'

/**
 * Geographic-map checks. Opt-in: set BOUNDARY_FIXTURE to a local boundary file
 * (e.g. the DataMeet districts converted with scripts/simplify-boundaries.md).
 * The file is served through a route, so no boundary data lives in the repo.
 */
const fixture = process.env.BOUNDARY_FIXTURE
test.skip(!fixture, 'BOUNDARY_FIXTURE not set')

test.beforeEach(async ({ page }) => {
  await page.route('**/geo/india_districts.topojson', (route) => route.fulfill({ path: fixture!, contentType: 'application/json' }))
})

for (const width of [375, 768, 1440]) {
  test(`geographic map @ ${width}px`, async ({ page }) => {
    const problems: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('React'))) problems.push(m.text().slice(0, 300))
    })
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    await page.goto('/map?view=map&h=2&focus=tn-madurai')
    await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached({ timeout: 15_000 })
    await expect(page.getByText('District boundaries: DataMeet India community', { exact: false }).first()).toBeVisible()
    await page.waitForTimeout(900) // flyToBounds
    await page.screenshot({ path: `qa/screenshots/geo-map-${width}.png`, fullPage: true })
    await page.goto('/')
    await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached({ timeout: 15_000 })
    await page.screenshot({ path: `qa/screenshots/geo-overview-${width}.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    expect(problems).toEqual([])
  })
}

test('clicking a district shape opens the shared panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/map?view=map&focus=tn-madurai')
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached({ timeout: 15_000 })
  await page.waitForTimeout(900)
  // Madurai is centred by the focus zoom.
  const box = (await page.locator('.leaflet-container').first().boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Madurai' })).toBeVisible()
})
