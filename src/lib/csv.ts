/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  row.push(field)
  if (row.some((v) => v !== '')) rows.push(row)

  const [header, ...body] = rows
  if (!header) return []
  const keys = header.map((h) => h.trim().replace(/^\uFEFF/, ''))
  return body.map((r) => Object.fromEntries(keys.map((k, j) => [k, (r[j] ?? '').trim()])))
}

export type CsvCell = string | number | boolean | null | undefined

/** Byte-order mark so Excel opens UTF-8 (Hindi, Tamil) correctly. */
export const CSV_BOM = '\uFEFF'

/**
 * Formula-injection guard: a cell starting with = + - @ (or a tab / carriage
 * return) is prefixed with an apostrophe so spreadsheet apps show it as text.
 */
export function guardCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** RFC 4180 CSV (CRLF line endings) with a BOM and the formula guard on every cell. */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  const line = (cells: CsvCell[]) => cells.map((c) => quote(guardCell(c == null ? '' : String(c)))).join(',')
  return CSV_BOM + [line(header), ...rows.map(line)].join('\r\n') + '\r\n'
}

/** Saves a CSV string as a UTF-8 file download. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
