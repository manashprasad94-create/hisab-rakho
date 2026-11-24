import { useState } from 'react'
import { X, Copy, Check, ExternalLink, Smartphone, AlertCircle } from 'lucide-react'
import Avatar from './Avatar'
import Button from './Button'
import { generateAppUpiLink, generateUpiLink } from '../lib/upi'

interface UpiPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  friend: {
    id: string
    full_name: string
    upi_id?: string | null
    phone?: string | null
    avatar_url?: string | null
  }
  amount: number
  reason?: string
  transactionId?: string
  onMarkPaid?: (transactionId: string, amount: number) => void
}

export default function UpiPaymentModal({
  isOpen,
  onClose,
  friend,
  amount,
  reason,
  transactionId,
  onMarkPaid,
}: UpiPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => {
      setCopiedField(null)
    }, 2000)
  }

  const handleAppLaunch = (app: 'gpay' | 'phonepe' | 'paytm' | 'generic') => {
    if (!friend.upi_id) return
    const link = generateAppUpiLink(app, friend.upi_id, friend.full_name, amount, reason)
    // Open the app deep link
    window.location.href = link

    // If app doesn't open within 1.5s (e.g. on desktop or app not installed), fallback to standard link
    if (app !== 'generic') {
      setTimeout(() => {
        // Fallback to standard generic upi link
        window.location.href = generateUpiLink(friend.upi_id!, friend.full_name, amount, reason)
      }, 1500)
    }
  }

  const handleMarkAsPaidClick = () => {
    if (transactionId && onMarkPaid) {
      onMarkPaid(transactionId, amount)
    }
    onClose()
  }

  const cleanPhone = friend.phone?.replace(/\D/g, '').slice(-10)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pay via UPI"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl overflow-hidden p-5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <Avatar name={friend.full_name} size="sm" src={friend.avatar_url || undefined} />
            <div>
              <p className="text-sm font-bold leading-tight">{friend.full_name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Paying via UPI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="my-4 p-3 rounded-xl bg-[var(--color-surface-muted)] text-center">
          <p className="text-xs text-[var(--color-text-muted)] font-medium">Amount to Pay</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--color-text)] mt-0.5">
            ₹{amount.toFixed(2)}
          </p>
          {reason && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
              For: {reason}
            </p>
          )}
        </div>

        {/* Preferred UPI Apps */}
        {friend.upi_id && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
              Launch Preferred UPI App
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* Google Pay */}
              <button
                type="button"
                onClick={() => handleAppLaunch('gpay')}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors text-xs font-semibold"
              >
                <span className="w-6 h-6 rounded-full bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center font-bold text-[11px]">
                  G
                </span>
                GPay
              </button>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => handleAppLaunch('phonepe')}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors text-xs font-semibold"
              >
                <span className="w-6 h-6 rounded-full bg-[#5f259f]/10 text-[#5f259f] flex items-center justify-center font-bold text-[11px]">
                  Pe
                </span>
                PhonePe
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => handleAppLaunch('paytm')}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors text-xs font-semibold"
              >
                <span className="w-6 h-6 rounded-full bg-[#00b9f5]/10 text-[#00b9f5] flex items-center justify-center font-bold text-[11px]">
                  ₹
                </span>
                Paytm
              </button>
            </div>

            {/* Any UPI App button */}
            <Button
              type="button"
              onClick={() => handleAppLaunch('generic')}
              className="w-full mt-2 text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={14} /> Open in Any UPI App
            </Button>
          </div>
        )}

        {/* Copy Details Section (Fail-safe if link has risk warning) */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">
            Quick Copy (If link shows risk warning)
          </p>

          {/* UPI ID */}
          {friend.upi_id && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-muted)] text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[var(--color-text-muted)] block text-[10px]">UPI ID</span>
                <span className="font-mono font-medium truncate block">{friend.upi_id}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(friend.upi_id!, 'upi')}
                className="shrink-0 p-1.5 rounded-md hover:bg-[var(--color-bg)] transition-colors font-semibold flex items-center gap-1 text-[var(--color-primary)]"
                title="Copy UPI ID"
              >
                {copiedField === 'upi' ? <Check size={14} className="text-receive" /> : <Copy size={14} />}
                <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Phone Number */}
          {friend.phone && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-muted)] text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[var(--color-text-muted)] block text-[10px]">Phone Number</span>
                <span className="font-medium truncate block flex items-center gap-1">
                  <Smartphone size={12} className="text-[var(--color-text-muted)] shrink-0" />
                  {friend.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(cleanPhone || friend.phone!, 'phone')}
                className="shrink-0 p-1.5 rounded-md hover:bg-[var(--color-bg)] transition-colors font-semibold flex items-center gap-1 text-[var(--color-primary)]"
                title="Copy phone number"
              >
                {copiedField === 'phone' ? <Check size={14} className="text-receive" /> : <Copy size={14} />}
                <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tip / Fallback helper */}
        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--color-text-muted)] bg-[var(--color-surface-muted)]/50 p-2 rounded-lg leading-relaxed">
          <AlertCircle size={13} className="shrink-0 mt-0.5 text-[var(--color-accent)]" />
          <span>
            Most UPI apps block pre-filled browser links for personal VPAs. If you see a warning, tap <strong>Copy</strong> above and send money to your friend's UPI ID or phone number directly.
          </span>
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 text-xs py-2"
          >
            Close
          </Button>
          {transactionId && onMarkPaid && (
            <Button
              type="button"
              onClick={handleMarkAsPaidClick}
              className="flex-1 text-xs py-2 font-semibold"
            >
              I've Paid
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
