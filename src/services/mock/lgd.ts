/**
 * LGD codes for demo districts come ONLY from the team-supplied
 * public/data/lgd_districts.csv. Without it every lgd_code stays null.
 */
import { LGD_CSV_URL } from '@/config/geo'
import { parseCsv } from '@/lib/csv'
import { normaliseName } from '@/lib/names'
import type { Dataset } from './generate'

let codes: Promise<Map<string, string>> | null = null
const applied = new WeakSet<Dataset>()

async function loadCodes(): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  try {
    const res = await fetch(LGD_CSV_URL)
    // The dev server answers unknown paths with index.html.
    if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) return out
    for (const r of parseCsv(await res.text())) {
      if (r.lgd_code && r.district && r.state) out.set(`${normaliseName(r.state)}|${normaliseName(r.district)}`, r.lgd_code)
    }
  } catch {
    /* no CSV → codes stay null */
  }
  return out
}

export async function applyLgdCodes(ds: Dataset): Promise<void> {
  if (applied.has(ds) || typeof fetch === 'undefined') return
  codes ??= loadCodes()
  const map = await codes
  for (const d of ds.districts) {
    d.ref.lgd_code = map.get(`${normaliseName(d.ref.state)}|${normaliseName(d.ref.name)}`) ?? null
  }
  applied.add(ds)
}
