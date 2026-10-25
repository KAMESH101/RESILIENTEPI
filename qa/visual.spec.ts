import { expect, test, type Page } from '@playwright/test'

const WIDTHS = [375, 768, 1440] as const

/** Pages (and key states) to capture. Grows as phases are built. */
/** `overlay` shots capture the viewport only — fixed dialogs/drawers misrepresent in full-page captures. */
/** `noBoundary` blocks the boundary file to capture the schematic fallback. */
const SHOTS: { name: string; path: string; overlay?: boolean; noBoundary?: boolean; setup?: (page: Page) => Promise<void> }[] = [
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
  { name: 'district-madurai', path: '/district/tn-madurai?h=2' },
  { name: 'district-darjeeling', path: '/district/wb-darjeeling' },
  { name: 'district-bathinda', path: '/district/pb-bathinda' },
  { name: 'district-medchal', path: '/district/tg-medchal-malkajgiri' },
  { name: 'map', path: '/map' },
  { name: 'map-high-risk', path: '/map?risk=high&h=2' },
  { name: 'map-table', path: '/map?view=table&bs=any' },
  { name: 'map-view-map', path: '/map?view=map&focus=ka-kalaburagi' },
  { name: 'map-layers-off', path: '/map?view=map&risk_layer=0' },
  { name: 'map-fallback', path: '/map?view=map&focus=ka-kalaburagi', noBoundary: true },
  { name: 'overview-fallback', path: '/', noBoundary: true },
  { name: 'map-panel', path: '/map?h=2&focus=tn-madurai&district=tn-madurai', overlay: true },
  { name: 'blind-spots', path: '/blind-spots' },
  { name: 'blind-spots-focus', path: '/blind-spots?focus=ka-kalaburagi' },
  { name: 'blind-spots-all-karnataka', path: '/blind-spots?band=all&state=Karnataka' },
  { name: 'blind-spots-empty', path: '/blind-spots?state=Kerala' },
  {
    name: 'blind-spots-review-dialog',
    path: '/blind-spots',
    overlay: true,
    setup: async (page) => {
      await page.getByRole('button', { name: 'Flag for audit' }).first().click()
      await page.getByRole('alertdialog').waitFor()
    },
  },
  { name: 'actions', path: '/actions' },
  { name: 'actions-madurai', path: '/actions?dist=tn-madurai' },
  { name: 'actions-p3', path: '/actions?priority=p3' },
  {
    name: 'actions-complete-dialog',
    path: '/actions?dist=tn-madurai',
    overlay: true,
    setup: async (page) => {
      await page.getByRole('button', { name: 'Mark Completed' }).first().click()
      await page.getByRole('alertdialog').waitFor()
    },
  },
  { name: 'reports', path: '/reports' },
  { name: 'reports-hi-district', path: '/reports?scope=district&target=tn-madurai&lang=hi' },
  { name: 'reports-ta-state', path: '/reports?scope=state&target=Tamil%20Nadu&lang=ta' },
  { name: 'reports-en-national', path: '/reports?scope=national&lang=en' },
  {
    name: 'reports-print-ta',
    path: '/reports?scope=district&target=tn-madurai&lang=ta',
    setup: async (page) => {
      await page.emulateMedia({ media: 'print' })
    },
  },
  { name: 'methodology-method', path: '/methodology' },
  { name: 'methodology-results', path: '/methodology?tab=results' },
  { name: 'methodology-sources', path: '/methodology?tab=sources' },
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
        // The deliberately blocked boundary file logs a 404; nothing else may.
        if (shot.noBoundary && m.text().startsWith('Failed to load resource')) return
        if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('React'))) problems.push(m.text().slice(0, 300))
      })
      page.on('pageerror', (e) => problems.push(e.message))
      if (shot.noBoundary) await page.route('**/geo/india_districts.*', (r) => r.fulfill({ status: 404, body: '' }))
      await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
      await page.goto(shot.path)
      await settle(page)
      if (shot.setup) {
        await shot.setup(page)
        await settle(page)
      }
      await page.waitForTimeout(250) // let 150–200 ms transitions finish

      // On overflow, name the first elements that stick out so the CI annotation says what to fix.
      const { overflow, culprits } = await page.evaluate(() => {
        const w = document.documentElement.clientWidth
        const over = document.documentElement.scrollWidth - w
        const culprits =
          over <= 0
            ? []
            : [...document.querySelectorAll('main *, body > div *')]
                .filter((e) => e.getBoundingClientRect().right > w + 1)
                .slice(0, 6)
                .map((e) => `${e.tagName.toLowerCase()}[${String((e as HTMLElement).className).slice(0, 80)}] "${(e.textContent ?? '').trim().slice(0, 40)}"`)
        return { overflow: over, culprits }
      })
      await page.screenshot({ path: `qa/screenshots/${shot.name}-${width}.png`, fullPage: !shot.overlay })
      expect(overflow, `page must not scroll horizontally; first overflowing: ${culprits.join(' | ')}`).toBeLessThanOrEqual(0)
      expect(problems, 'no console errors or React warnings').toEqual([])
    })
  }
}
