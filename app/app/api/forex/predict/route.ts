import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getLiveRate } from '@/lib/forex'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { base, target } = await req.json()
    if (!base || !target) return NextResponse.json({ error: 'Missing base/target' }, { status: 400 })

    const currentRate = await getLiveRate(base, target)

    // Generate month labels
    const now = new Date()
    const pastMonths = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      pastMonths.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }))
    }
    const futureMonths = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      futureMonths.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }))
    }

    const prompt = `You are a forex analyst. Current rate: 1 ${base} = ${currentRate} ${target}.
Generate realistic past 12 months historical rates and a 3-month forecast.
Past months to generate data for: ${pastMonths.join(', ')}.
Future months to predict: ${futureMonths.join(', ')}.

Respond ONLY with this exact JSON (no markdown, no explanation):
{
  "trend":"up",
  "prediction_3m":${(currentRate * 1.02).toFixed(4)},
  "best_time":"now",
  "reasoning":"Brief 2-sentence analysis.",
  "confidence":"medium",
  "historical_12_months": [
    ${pastMonths.map(m => `{"label":"${m}","rate":${currentRate}}`).join(',\n    ')}
  ],
  "next_3_months":[
    ${futureMonths.map(m => `{"month":"${m}","predicted_rate":${currentRate}}`).join(',\n    ')}
  ]
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    })

    let analysis: any = {}
    let historical: any[] = []
    try {
      const text = completion.choices[0]?.message?.content ?? '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      
      historical = parsed.historical_12_months || pastMonths.map(m => ({ label: m, rate: currentRate }))
      historical.push({ label: 'Now', rate: currentRate })
      
      analysis = {
        trend: parsed.trend || 'stable',
        prediction_3m: parsed.prediction_3m || currentRate,
        best_time: parsed.best_time || 'now',
        reasoning: parsed.reasoning || 'No analysis available.',
        confidence: parsed.confidence || 'medium',
        next_3_months: parsed.next_3_months || [],
      }
    } catch {
      historical = pastMonths.map(m => ({ label: m, rate: currentRate }))
      historical.push({ label: 'Now', rate: currentRate })
      analysis = {
        trend: 'stable',
        prediction_3m: currentRate,
        best_time: 'now',
        reasoning: `The ${base}/${target} pair is currently at ${currentRate}. Monitor market conditions before sending.`,
        confidence: 'medium',
        next_3_months: futureMonths.map(m => ({ month: m, predicted_rate: currentRate })),
      }
    }

    return NextResponse.json({ currentRate, historical, analysis, base, target })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
