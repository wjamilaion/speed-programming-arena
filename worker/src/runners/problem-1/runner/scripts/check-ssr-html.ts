/**
 * SSR / no-JS HTML body check script (Option 3)
 * Runner copy: uses STATIC_DIR env when set (e.g. by run-submission.sh).
 *
 * Fetches each URL and verifies the live HTML body contains the same key
 * sections as that page's static snapshot. Outputs state-based JSON for
 * pipeline consumption; exit code indicates pass/fail. Details include missing
 * section ids per failed page when applicable.
 *
 * Run: npm run check-ssr-html (from runner/ with STATIC_DIR=./static)
 * Or:  BASE_URL=https://example.com STATIC_DIR=/path/to/static npm run check-ssr-html
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'

const PATH_TO_STATIC: Record<string, string> = {
  '/': 'homepage.html',
  '/research-assistant': 'research-assistant.html',
  '/copy-checker': 'copy-checker.html',
  '/content-personalizer': 'content-personalizer.html',
  '/writing': 'writing.html',
  '/gpt-detector': 'gpt-detector.html',
  '/pricing': 'pricing.html',
}

const BODY_REGEX = /<body[^>]*>([\s\S]*?)<\/body>/i
const ID_DOUBLE_REGEX = /id="([^"]+)"/g
const ID_SINGLE_REGEX = /id='([^']+)'/g
const ARIA_LABELLEDBY_REGEX = /aria-labelledby="([^"]+)"/g

/** Exclude auto-generated ids (e.g. Radix UI) that differ between static snapshot and live render. */
function isStableSectionId(id: string): boolean {
  if (id.startsWith('radix-')) return false
  return true
}

type UrlState = 'pass' | 'fail'

interface UrlDetails {
  missingSections?: string[]
  error?: string
}

interface CheckResult {
  success: boolean
  results: Record<string, UrlState>
  details: Record<string, UrlDetails>
}

function getStaticDir(): string {
  if (process.env.STATIC_DIR) return process.env.STATIC_DIR
  const cwd = process.cwd()
  const inNextVersion = cwd.endsWith('next-version')
  return inNextVersion ? join(cwd, 'static') : join(cwd, 'static')
}

function extractBody(html: string): string | null {
  const match = html.match(BODY_REGEX)
  return match ? match[1] : null
}

function extractSectionIds(body: string): string[] {
  const ids = new Set<string>()
  let m: RegExpExecArray | null
  const reDouble = new RegExp(ID_DOUBLE_REGEX.source, 'g')
  while ((m = reDouble.exec(body)) !== null) ids.add(m[1])
  const reSingle = new RegExp(ID_SINGLE_REGEX.source, 'g')
  while ((m = reSingle.exec(body)) !== null) ids.add(m[1])
  const reAria = new RegExp(ARIA_LABELLEDBY_REGEX.source, 'g')
  while ((m = reAria.exec(body)) !== null) ids.add(m[1])
  return Array.from(ids).filter(isStableSectionId)
}

function sectionExistsInBody(body: string, sectionId: string): boolean {
  return (
    body.includes(`id="${sectionId}"`) ||
    body.includes(`id='${sectionId}'`) ||
    body.includes(`aria-labelledby="${sectionId}"`)
  )
}

async function main(): Promise<void> {
  const staticDir = getStaticDir()
  const results: Record<string, UrlState> = {}
  const details: Record<string, UrlDetails> = {}

  for (const [path, filename] of Object.entries(PATH_TO_STATIC)) {
    const staticPath = join(staticDir, filename)
    const url = `${BASE_URL}${path}`

    if (!existsSync(staticPath)) {
      results[path] = 'fail'
      details[path] = { error: 'static_file_not_found' }
      continue
    }

    let staticHtml: string
    try {
      staticHtml = readFileSync(staticPath, 'utf-8')
    } catch {
      results[path] = 'fail'
      details[path] = { error: 'static_file_read_error' }
      continue
    }

    const staticBody = extractBody(staticHtml)
    if (!staticBody) {
      results[path] = 'fail'
      details[path] = { error: 'static_body_extract_failed' }
      continue
    }

    const requiredSections = extractSectionIds(staticBody)
    if (requiredSections.length === 0) {
      results[path] = 'fail'
      details[path] = { error: 'no_section_ids_in_static' }
      continue
    }

    let liveHtml: string
    try {
      const res = await fetch(url)
      if (!res.ok) {
        results[path] = 'fail'
        details[path] = { error: `http_${res.status}` }
        continue
      }
      liveHtml = await res.text()
    } catch {
      results[path] = 'fail'
      details[path] = { error: 'fetch_failed' }
      continue
    }

    const liveBody = extractBody(liveHtml)
    if (!liveBody) {
      results[path] = 'fail'
      details[path] = { error: 'live_body_extract_failed' }
      continue
    }

    const missing = requiredSections.filter((id) => !sectionExistsInBody(liveBody, id))
    if (missing.length === 0) {
      results[path] = 'pass'
    } else {
      results[path] = 'fail'
      details[path] = { missingSections: missing }
    }
  }

  const success = Object.values(results).every((s) => s === 'pass')
  const output: CheckResult = { success, results, details }
  console.log(JSON.stringify(output))
  process.exit(success ? 0 : 1)
}

main()
