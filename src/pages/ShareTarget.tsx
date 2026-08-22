import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ShareTarget() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('Reading shared payment...')

  useEffect(() => {
    const process = async () => {
      const shared = searchParams.get('shared')

      if (shared === '1') {
        try {
          const cache = await caches.open('share-target-cache')
          const response = await cache.match('/shared-receipt')
          if (!response) {
            navigate('/add-expense', { replace: true })
            return
          }

          const blob = await response.blob()
          const base64 = await blobToBase64(blob)

          setStatus('Reading amount from screenshot...')

          const { data, error } = await supabase.functions.invoke('ocr-receipt', {
            body: { imageBase64: base64 },
          })

          await cache.delete('/shared-receipt')

          if (error || !data) {
            navigate('/add-expense', { replace: true })
            return
          }

          const params = new URLSearchParams()
          if (data.amount) params.set('amount', String(data.amount))
          if (data.note) params.set('note', data.note)

          navigate(`/add-expense?${params.toString()}`, { replace: true })
        } catch {
          navigate('/add-expense', { replace: true })
        }
        return
      }

      // fallback: text-based share (older flow)
      const text = searchParams.get('text') || ''
      const title = searchParams.get('title') || ''
      const combined = `${title} ${text}`
      const amountMatch = combined.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i) || combined.match(/([\d,]+(?:\.\d{1,2})?)/)
      const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : ''

      const params = new URLSearchParams()
      if (amount) params.set('amount', amount)
      if (combined.trim()) params.set('note', combined.trim().slice(0, 200))

      navigate(`/add-expense?${params.toString()}`, { replace: true })
    }

    process()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft">
      <p className="text-text-muted">{status}</p>
    </div>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}