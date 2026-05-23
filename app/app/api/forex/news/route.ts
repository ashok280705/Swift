import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const base = req.nextUrl.searchParams.get('base') ?? 'INR'
  const target = req.nextUrl.searchParams.get('target') ?? 'USD'

  const query = `${base} ${target} exchange rate forex trend 2025`

  const res = await fetch('https://google.serper.dev/news', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 6 }),
  })

  if (!res.ok) return NextResponse.json({ news: [] })
  const data = await res.json()

  const news = (data.news ?? []).slice(0, 6).map((n: any) => ({
    title: n.title,
    snippet: n.snippet,
    source: n.source,
    date: n.date,
    link: n.link,
    imageUrl: n.imageUrl,
  }))

  return NextResponse.json({ news })
}
