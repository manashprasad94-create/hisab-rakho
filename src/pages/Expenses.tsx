import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wallet, Trash2, UtensilsCrossed, Fuel, ShoppingBag, Plane, Film, HeartPulse, GraduationCap, MoreHorizontal, Search, Download, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { listExpenses, deleteExpense, updateExpense, getCategorySummary } from '../lib/expenses'
import Card from '../components/card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { exportToCsv } from '../lib/exportCsv'

const CATEGORY_ICONS: Record<string, any> = {
  food: UtensilsCrossed,
  fuel: Fuel,
  shopping: ShoppingBag,
  travel: Plane,
  entertainment: Film,
  medical: HeartPulse,
  education: GraduationCap,
  other: MoreHorizontal,
}

export default function Expenses() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState<any[]>([])
  const [summary, setSummary] = useState<{ summary: Record<string, number>; total: number; count: number }>({
    summary: {},
    total: 0,
    count: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // "YYYY-MM"

  const loadData = async () => {
    const [list, sum] = await Promise.all([listExpenses(), getCategorySummary(selectedMonth)])
    setExpenses(list)
    setSummary(sum)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  const changeMonth = (delta: number) => {
    let [year, month] = selectedMonth.split('-').map(Number)
    month += delta
    if (month > 12) {
      month = 1
      year += 1
    }
    if (month < 1) {
      month = 12
      year -= 1
    }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`)
  }

  const monthLabel = new Date(selectedMonth + '-01T12:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  // Filter the expense list to the selected month too, so history matches the summary
  const monthFilteredExpenses = expenses.filter((e) => e.spent_on.startsWith(selectedMonth))

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const filteredExpenses = monthFilteredExpenses.filter(
    (e) =>
      e.note?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      e.category?.toLowerCase().includes(filterQuery.toLowerCase())
  )

  const groupedByDate = filteredExpenses.reduce((groups: Record<string, any[]>, e) => {
    const dateKey = new Date(e.spent_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(e)
    return groups
  }, {})

    const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editMode, setEditMode] = useState<'cash' | 'online'>('online')

  const startEdit = (e: any) => {
    setEditingId(e.id)
    setEditAmount(String(e.amount))
    setEditNote(e.note || '')
    setEditMode(e.payment_mode || 'online')
  }

  const saveEdit = async (id: string) => {
    if (!editAmount || Number(editAmount) <= 0) return
    await updateExpense(id, { amount: Number(editAmount), note: editNote, payment_mode: editMode })
    setEditingId(null)
    loadData()
  }

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      deleteExpense(id).then(loadData)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <h1 className="text-xl font-semibold mb-4">Expenses</h1>

      <div className="bg-primary text-white rounded-2xl p-6 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => changeMonth(-1)} className="p-1">
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-medium">{monthLabel}</p>
          <button onClick={() => changeMonth(1)} className="p-1">
            <ChevronRight size={18} />
          </button>
        </div>
        <p className="text-3xl font-semibold mt-1">₹{summary.total.toFixed(2)}</p>
        <p className="text-xs opacity-70 mt-1">{summary.count} expenses</p>
      </div>

      {Object.keys(summary.summary).length > 0 && (
        <Card className="p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3">By Category</h2>
          <div className="space-y-2">
            {Object.entries(summary.summary)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const Icon = CATEGORY_ICONS[cat] || MoreHorizontal
                const pct = summary.total > 0 ? (amt / summary.total) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-primary" />
                        <span className="capitalize">{cat}</span>
                      </div>
                      <span className="font-medium">₹{amt.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-5">
        <Button onClick={() => navigate('/add-expense')} className="flex-1 flex items-center justify-center gap-2">
          <Plus size={18} /> Add Expense
        </Button>
        {expenses.length > 0 && (
          <Button
            variant="secondary"
            onClick={() =>
              exportToCsv(
                'hisab-kitab-expenses.csv',
                expenses.map((e) => ({
                  date: e.spent_on,
                  category: e.category,
                  amount: e.amount,
                  note: e.note,
                }))
              )
            }
            className="flex items-center justify-center gap-2 px-4"
          >
            <Download size={18} />
          </Button>
        )}
      </div>

      <h2 className="text-sm font-semibold text-text-muted mb-3">All Expenses</h2>

      {expenses.length > 3 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by note or category..."
            className="w-full pl-8 pr-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Wallet} title="No expenses yet" subtitle="Add your first expense to start tracking spending" />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-text-muted mb-2">
                {dateLabel} · {items.length} spending{items.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {items.map((e) => {
                  const Icon = CATEGORY_ICONS[e.category] || MoreHorizontal

                  if (editingId === e.id) {
                    return (
                      <Card key={e.id} className="p-3">
                        <label className="block text-xs mb-1 text-text-muted font-medium">Amount</label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(ev) => setEditAmount(ev.target.value)}
                          className="w-full mb-2 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <label className="block text-xs mb-1 text-text-muted font-medium">Reason / Details</label>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(ev) => setEditNote(ev.target.value)}
                          className="w-full mb-2 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => setEditMode('cash')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${editMode === 'cash' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
                          >
                            Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMode('online')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${editMode === 'online' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
                          >
                            Online
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => saveEdit(e.id)} className="text-xs py-1.5 px-3 flex-1">Save</Button>
                          <Button variant="secondary" onClick={() => setEditingId(null)} className="text-xs py-1.5 px-3 flex-1">Cancel</Button>
                        </div>
                      </Card>
                    )
                  }

                  return (
                    <Card key={e.id} className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{e.note || 'No reason'}</p>
                          <p className="text-xs text-text-muted capitalize">
                            {e.category} · {e.payment_mode || 'online'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">₹{Number(e.amount).toFixed(2)}</p>
                        <button onClick={() => startEdit(e)} className="text-text-muted hover:text-primary transition">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(e.id)}
                          className={`transition ${confirmDeleteId === e.id ? 'text-owe font-medium text-xs px-2 py-1 bg-owe/10 rounded-lg' : 'text-text-muted hover:text-owe'}`}
                        >
                          {confirmDeleteId === e.id ? 'Confirm?' : <Trash2 size={15} />}
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}