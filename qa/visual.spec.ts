import { expect, test, type Page } from '@playwright/test'

const WIDTHS = [375, 768, 1440] as const

/** Pages (and key states) to capture. Grows as phases are built. */
/** `overlay` shots capture the viewport only — fixed dialogs/drawers misrepresent in full-page captures. */
const SHOTS: { name: string; path: string; overlay?: boolean; setup?: (page: Page) => Promise<void> }[] = [
  { name: 'overview', path: '/' },
  { name: 'overview-h3-kerala', path: '/?h=3&state=Kerala' },
  { name: 'overview-panel', path: '/?district=tn-madurai', overlay: true },
  {
    name: 'overview-create-action',
    path: '/',
    overlay: true,
    setup: async (page) => {
      await page.getByRole('button', { name: 'Create action' }).first().click()
      await page.getByRole('dialog').waitFor()
    },
  },
  {
    name: 'overview-tour',
    path: '/',
    overlay: true,
    setup: async (page) => {
      await page.getByRole('button', { name: 'Demo tour' }).click()
      await page.getByRole('complementary', { name: 'Demo tour' }).waitFor()
    },
  },
  { name: 'overview-table-view', path: '/', setup: async (page) => page.getByRole('button', { name: 'View as table' }).first().click() },
  { name: 'district-picker', path: '/district' },
  { name: 'district-interim', path: '/district/ka-kalaburagi' },
  { name: 'map', path: '/map' },
  { name: 'map-high-risk', path: '/map?risk=high&h=2' },
  { name: 'map-table', path: '/map?view=table&bs=any' },
  { name: 'map-view-map', path: '/map?view=map&focus=ka-kalaburagi' },
  { name: 'map-layers-off', path: '/map?view=map&risk_layer=0' },
  { name: 'map-panel', path: '/map?h=2&focus=tn-madurai&district=tn-madurai', overlay: true },
  { name: 'blind-spots-placeholder', path: '/blind-spots' },
  { name: 'actions-placeholder', path: '/actions' },
  { name: 'reports-placeholder', path: '/reports' },
  { name: 'methodology-placeholder', path: '/methodology' },
]

async function settle(page: Page) {
  // Mock API latency is 300–800 ms; wait until no skeletons remain.
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 10_000 })
  await page.evaluate(() => document.fonts.ready)
}

for (const width of WIDTHS) {
  for (const shot of SHOTS) {
    test(`${shot.name} @ ${width}px`, async ({ page }) => {
      const problems: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('React'))) problems.push(m.text().slice(0, 300))
      })
      page.on('pageerror', (e) => problems.push(e.message))
      await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
      await page.goto(shot.path)
      await settle(page)
      if (shot.setup) {
        await shot.setup(page)
        await settle(page)
      }
      await page.waitForTimeout(250) // let 150–200 ms transitions finish

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      await page.screenshot({ path: `qa/screenshots/${shot.name}-${width}.png`, fullPage: !shot.overlay })
      expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0)
      expect(problems, 'no console errors or React warnings').toEqual([])
    })
  }
}
