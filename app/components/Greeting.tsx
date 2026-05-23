'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'

export default function Greeting({ name }: { name: string }) {
  const { t } = useLang()
  const [greet, setGreet] = useState('greeting.morning')

  useEffect(() => {
    const h = new Date().getHours()
    setGreet(h < 12 ? 'greeting.morning' : h < 17 ? 'greeting.afternoon' : 'greeting.evening')
  }, [])

  return <>{t(greet)}, {name}</>
}
