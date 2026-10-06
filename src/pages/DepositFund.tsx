import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Select, Input } from '../components/FormControls'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PlusCircle } from 'lucide-react'
import { depositToFundHolder, getHolderBalances, getMyRoleInFund, listFundMembers } from '../lib/groupFund'
import Card from '../components/card'
import Button from '../components/Button'

type Holder = { user_id: string; role: 'owner' | 'admin'; profiles: { full_name: string } | null }
type HolderBalance = { userId: string; cash: number; online: number }
const localToday = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export default function DepositFund() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [holders, setHolders] = useState<Holder[]>([])
  const [balances, setBalances] = useState<HolderBalance[]>([])
  const [holderId, setHolderId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [depositDate, setDepositDate] = useState(localToday)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (!fundId) return
    let active = true
    async function load() {
      try {
        const role = await getMyRoleInFund(fundId!)
        if (!active) return
        setIsOwner(role === 'owner')
        if (role !== 'owner') return
        const [members, holderBalances] = await Promise.all([
          listFundMembers(fundId!),
          getHolderBalances(fundId!),
        ])
        if (!active) return
        const eligible: Holder[] = (members || [])
          .filter((member) => member.role === 'owner' || member.role === 'admin')
          .map((member) => ({
            user_id: member.user_id,
            role: member.role,
            profiles: Array.isArray(member.profiles) ? member.profiles[0] || null : member.profiles || null,
          }))
        setHolders(eligible)
        setBalances(holderBalances)
        setHolderId(eligible[0]?.user_id || '')
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load fund holders')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [fundId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundId || !holderId) return
    setError('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError('Enter an amount greater than zero with at most two decimal places')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(depositDate) || depositDate > localToday()) {
      setError('Choose today or an earlier date')
      return
    }
    setSaving(true)
    try {
      await depositToFundHolder(fundId, holderId, value, paymentMode, reason, depositDate)
      navigate(`/group-fund/${fundId}`)
    } catch (err) {
      const failure = err as { code?: string; message?: string } | null
      setError(failure?.code === 'PGRST202'
        ? 'The dated deposit function is missing in Supabase. Apply the latest deposit SQL migration, then try again.'
        : failure?.message || 'Could not add money')
    } finally {
      setSaving(false)
    }
  }

  const selectedBalance = balances.find((balance) => balance.userId === holderId)

  return (
    <div className="app-page">
      <button onClick={() => navigate(`/group-fund/${fundId}`)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back to Fund
      </button>
      <PageHeader title={<> <PlusCircle size={20} className="text-primary" /> Add Money </>} />

      {loading ? (
        <LoadingState rows={2} />
      ) : !isOwner ? (
        <Card className="p-4 text-sm">{error || 'Only the fund owner can add money.'}</Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="p-4 mb-4">
            {error && <StatusMessage>{error}</StatusMessage>}

            <label htmlFor="fund-holder" className="block text-sm mb-1 text-text-muted font-medium">Add to</label>
            <Select
              id="fund-holder"
              value={holderId}
              onChange={(e) => setHolderId(e.target.value)}
              className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {holders.map((holder) => (
                <option key={holder.user_id} value={holder.user_id}>
                  {holder.profiles?.full_name || 'Unnamed holder'} ({holder.role === 'owner' ? 'Owner' : 'Co-owner'})
                </option>
              ))}
            </Select>

            <p className="text-xs text-text-muted mb-4">
              Current balance — Cash: ₹{(selectedBalance?.cash || 0).toFixed(2)} · Online: ₹{(selectedBalance?.online || 0).toFixed(2)}
            </p>

            <label htmlFor="deposit-amount" className="block text-sm mb-1 text-text-muted font-medium">Amount</label>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
              <Input
                id="deposit-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-border rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <p className="text-sm mb-2 text-text-muted font-medium">Money type</p>
            <div className="flex gap-2">
              {(['cash', 'online'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  aria-pressed={paymentMode === mode}
                  className={`flex-1 py-2 rounded-xl font-medium border text-sm capitalize ${paymentMode === mode ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <label htmlFor="deposit-reason" className="block text-sm mt-4 mb-1 text-text-muted font-medium">Reason (optional)</label>
            <Input
              id="deposit-reason"
              type="text"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly fund contribution"
              className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <label htmlFor="deposit-date" className="block text-sm mt-4 mb-1 text-text-muted font-medium">Date added</label>
            <Input
              id="deposit-date"
              type="date"
              required
              max={localToday()}
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Card>
          <Button type="submit" loading={saving} disabled={!holderId} className="w-full">
            {saving ? 'Adding...' : 'Add Money'}
          </Button>
          <p className="text-xs text-text-muted mt-3 text-center">The deposit will appear in Fund History.</p>
        </form>
      )}
    </div>
  )
}
