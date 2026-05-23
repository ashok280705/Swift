import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json({ link: null })

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 1 }),
    })
    const data = await res.json()
    const link = data.organic?.[0]?.link ?? null
    const title = data.organic?.[0]?.title ?? null
    return NextResponse.json({ link, title })
  } catch {
    return NextResponse.json({ link: null })
  }
}
