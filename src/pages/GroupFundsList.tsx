import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PiggyBank, Plus } from 'lucide-react'
import { listMyFunds, createFund } from '../lib/groupFund'
import Card from '../components/card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function GroupFundsList() {
  const navigate = useNavigate()
  const [funds, setFunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newFundName, setNewFundName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadData = async () => {
    const data = await listMyFunds()
    setFunds(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async () => {
    if (!newFundName.trim()) return
    setCreating(true)
    try {
      const fund = await createFund(newFundName)
      navigate(`/group-fund/${fund.id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <PiggyBank size={22} className="text-primary" /> Group Funds
      </h1>

      {showCreate ? (
        <Card className="p-4 mb-4">
          <label className="block text-sm mb-1 text-text-muted font-medium">Fund Name</label>
          <input
            type="text"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            placeholder="e.g. Flatmates Mess Fund"
            className="w-full mb-3 px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating} className="flex-1">
              {creating ? 'Creating...' : 'Create'}
            </Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setShowCreate(true)} className="w-full mb-4 flex items-center justify-center gap-2">
          <Plus size={18} /> New Fund
        </Button>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : funds.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={PiggyBank} title="No funds yet" subtitle="Create one to start tracking a shared pool of money" />
        </Card>
      ) : (
        <div className="space-y-2">
          {funds.map((f) => (
            <Card key={f.fundId} onClick={() => navigate(`/group-fund/${f.fundId}`)} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{f.name}</p>
                <p className="text-xs text-text-muted capitalize">{f.role}</p>
              </div>
              <PiggyBank size={18} className="text-primary" />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}