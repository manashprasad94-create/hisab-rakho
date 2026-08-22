import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ShareTarget() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const text = searchParams.get('text') || ''
    const title = searchParams.get('title') || ''
    const combined = `${title} ${text}`

    // Try to extract an amount like ₹500, Rs 500, INR 500.00, or plain 500.00
    const amountMatch = combined.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i) || combined.match(/([\d,]+(?:\.\d{1,2})?)/)
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : ''

    const params = new URLSearchParams()
    if (amount) params.set('amount', amount)
    if (combined.trim()) params.set('note', combined.trim().slice(0, 200))

    navigate(`/add-expense?${params.toString()}`, { replace: true })
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft">
      <p className="text-text-muted">Processing shared payment...</p>
    </div>
  )
}