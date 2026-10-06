import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Input } from '../components/FormControls'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PiggyBank, Plus } from 'lucide-react'
import { listMyFunds, createFund } from '../lib/groupFund'
import { errorMessage } from '../lib/errorMessage'
import Card from '../components/card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function GroupFundsList() {
  const navigate = useNavigate()
  const [funds, setFunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newFundName, setNewFundName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setFunds(await listMyFunds())
    } catch (err) {
      setError(errorMessage(err, 'Could not load funds'))
    } finally {
      setLoading(false)
    }
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
    } catch (err) {
      setError(errorMessage(err, 'Could not create fund'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="app-page">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <PageHeader title={<> <PiggyBank size={22} className="text-primary" /> Group Funds </>} />
      {error && <StatusMessage>{error}</StatusMessage>}

      {showCreate ? (
        <Card className="p-4 mb-4">
          <label htmlFor="groupfundslist-field-19" className="block text-sm mb-1 text-text-muted font-medium">Fund Name</label>
          <Input id="groupfundslist-field-19"
            type="text"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            placeholder="e.g. Flatmates Mess Fund"
            className="w-full mb-3 px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} loading={creating} className="flex-1">
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
        <LoadingState />
      ) : funds.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={PiggyBank} title="No funds yet" subtitle="Create one to start tracking a shared pool of money" />
        </Card>
      ) : (
        <div className="record-list">
          {funds.map((f) => (
            <Card key={f.fundId} onClick={() => navigate(`/group-fund/${f.fundId}`)} className="p-3 flex items-center justify-between">
              <div>
                <p className="record-title">{f.name}</p>
                <div className="record-status capitalize"><Badge>{f.role}</Badge></div>
              </div>
              <PiggyBank size={18} className="text-primary" />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
