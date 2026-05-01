import { NextRequest } from 'next/server'

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number {
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

function parseNumOrNaN(v: unknown): number {
  const n = parseFloat(String(v))
  return n
}

/** Derive calendar quarter label from fiscal-date-ending string "YYYY-MM-DD" */
function monthToQuarter(date: string): string {
  const m = parseInt(date.slice(5, 7))
  if (m <= 3) return 'Q1'
  if (m <= 6) return 'Q2'
  if (m <= 9) return 'Q3'
  return 'Q4'
}

// ── AV Earnings (Non-GAAP EPS + Estimate) ────────────────────────────────────

interface AVEarningsRecord {
  fiscalDateEnding: string
  reportedEPS: string
  estimatedEPS: string
  surprisePercentage: string
}

/** Fetch quarterly/annual Non-GAAP EPS + estimates from Alpha Vantage EARNINGS */
async function fetchAVEarnings(symbol: string, period: string, apiKey: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return null
    const raw = await res.json()
    if (raw['Information'] || raw['Note']) return null
    const records: AVEarningsRecord[] =
      period === 'annual' ? raw.annualEarnings : raw.quarterlyEarnings
    return Array.isArray(records) ? records : null
  } catch {
    return null
  }
}

/** Match income statement record to AV earnings by fiscal year-month (IS uses
 *  actual period-end date; AV normalises to month-end — both share YYYY-MM). */
function matchAVEarning(isDate: string, earnings: AVEarningsRecord[]) {
  const ym = isDate.slice(0, 7) // "2026-03"
  return earnings.find((e) => e.fiscalDateEnding.slice(0, 7) === ym)
}

/** Enrich income statement rows with Non-GAAP EPS + estimate from AV earnings */
function enrichWithEarnings<T extends { date: string }>(
  data: T[],
  earnings: AVEarningsRecord[] | null
): (T & { epsNonGaap: number; epsEstimate: number })[] {
  return data.map((item) => {
    const match = earnings ? matchAVEarning(item.date, earnings) : undefined
    return {
      ...item,
      epsNonGaap: match ? parseNumOrNaN(match.reportedEPS) : NaN,
      epsEstimate: match ? parseNumOrNaN(match.estimatedEPS) : NaN,
    }
  })
}

// ── FMP fetch ─────────────────────────────────────────────────────────────────

async function fetchFMP(symbol: string, period: string, apiKey: string) {
  const fmpPeriod = period === 'annual' ? 'annual' : 'quarter'
  const url = `https://financialmodelingprep.com/stable/income-statement?symbol=${symbol}&period=${fmpPeriod}&limit=5&apikey=${apiKey}`
  const res = await fetch(url)

  if (res.status === 402) return { status: 402 as const, data: null }
  if (!res.ok) return { status: res.status, data: null }

  const raw = await res.json()
  if (!Array.isArray(raw) || raw.length === 0) return { status: 404 as const, data: null }

  const data = raw.map((item: Record<string, unknown>) => ({
    date: String(item.date),
    symbol: String(item.symbol),
    period: String(item.period),
    fiscalYear: String(item.fiscalYear),
    revenue: parseNum(item.revenue),
    grossProfit: parseNum(item.grossProfit),
    operatingIncome: parseNum(item.operatingIncome),
    netIncome: parseNum(item.netIncome),
    eps: parseNum(item.eps),
    costOfRevenue: parseNum(item.costOfRevenue),
    ebitda: parseNum(item.ebitda),
    researchAndDevelopment: parseNum(item.researchAndDevelopmentExpenses),
    sga: parseNum(item.sellingGeneralAndAdministrativeExpenses),
    epsDiluted: parseNum(item.epsDiluted),
    sharesOutDil: parseNum(item.weightedAverageShsOutDil),
    source: 'fmp' as const,
  }))

  return { status: 200 as const, data }
}

// ── Alpha Vantage fallback ────────────────────────────────────────────────────

async function fetchAV(symbol: string, period: string, apiKey: string) {
  const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return { status: res.status, data: null }

  const raw = await res.json()

  // AV returns { Information: "..." } when rate-limited or key invalid
  if (raw['Information'] || raw['Note']) {
    return { status: 429 as const, data: null }
  }

  const reports: Record<string, unknown>[] =
    period === 'annual' ? raw.annualReports : raw.quarterlyReports

  if (!Array.isArray(reports) || reports.length === 0) {
    return { status: 404 as const, data: null }
  }

  const data = reports.slice(0, 5).map((item) => {
    const date = String(item.fiscalDateEnding)
    const yr = date.slice(0, 4)
    const qtr = monthToQuarter(date)
    return {
      date,
      symbol,
      period: period === 'annual' ? 'FY' : qtr,
      fiscalYear: yr,
      revenue: parseNum(item.totalRevenue),
      grossProfit: parseNum(item.grossProfit),
      operatingIncome: parseNum(item.operatingIncome),
      netIncome: parseNum(item.netIncome),
      eps: NaN,
      costOfRevenue: parseNum(item.costOfRevenue),
      ebitda: parseNum(item.ebitda),
      researchAndDevelopment: parseNum(item.researchAndDevelopment),
      sga: parseNum(item.sellingGeneralAndAdministrative),
      epsDiluted: NaN,
      sharesOutDil: 0,
      source: 'av' as const,
    }
  })

  return { status: 200 as const, data }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase().trim()
  const period = searchParams.get('period') ?? 'annual'

  if (!symbol || !/^[A-Z]{1,5}$/.test(symbol)) {
    return Response.json({ error: 'Invalid ticker symbol' }, { status: 400 })
  }
  if (!['annual', 'quarter'].includes(period)) {
    return Response.json({ error: 'Invalid period' }, { status: 400 })
  }

  const fmpKey = process.env.FMP_API_KEY
  const avKey = process.env.AV_API_KEY

  if (!fmpKey && !avKey) {
    return Response.json({ error: 'No API keys configured' }, { status: 500 })
  }

  try {
    // Start AV earnings fetch immediately (runs in parallel with income fetch)
    const avEarningsPromise = avKey ? fetchAVEarnings(symbol, period, avKey) : null

    let incomeData: { date: string; [key: string]: unknown }[] | null = null

    // 1. Try FMP first
    if (fmpKey) {
      const fmp = await fetchFMP(symbol, period, fmpKey)
      if (fmp.status === 200 && fmp.data) {
        incomeData = fmp.data
      } else if (fmp.status !== 402 && fmp.status !== 404) {
        return Response.json({ error: `FMP error ${fmp.status}` }, { status: 502 })
      }
    }

    // 2. Fallback to Alpha Vantage income statement
    if (!incomeData && avKey) {
      const av = await fetchAV(symbol, period, avKey)
      if (av.status === 200 && av.data) {
        incomeData = av.data
      } else if (av.status === 429) {
        return Response.json(
          { error: 'Alpha Vantage rate limit reached (25/day). Try again tomorrow.' },
          { status: 429 }
        )
      } else if (av.status === 404) {
        return Response.json({ error: `No data found for "${symbol}"` }, { status: 404 })
      } else {
        return Response.json({ error: `Alpha Vantage error ${av.status}` }, { status: 502 })
      }
    }

    if (!incomeData) {
      return Response.json(
        {
          error: `"${symbol}" is not available on your FMP free plan. Add an AV_API_KEY in .env.local to unlock all stocks.`,
        },
        { status: 402 }
      )
    }

    // 3. Enrich with Non-GAAP EPS + estimates (already fetching in parallel)
    const avEarnings = avEarningsPromise ? await avEarningsPromise : null
    const enriched = enrichWithEarnings(incomeData, avEarnings)

    return Response.json(enriched)
  } catch {
    return Response.json({ error: 'Network error' }, { status: 500 })
  }
}
