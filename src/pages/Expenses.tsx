import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wallet, Trash2, UtensilsCrossed, Fuel, ShoppingBag, Plane, Film, HeartPulse, GraduationCap, MoreHorizontal, Search, Download} from 'lucide-react'
import { listExpenses, deleteExpense, getCategorySummary } from '../lib/expenses'
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

  const loadData = async () => {
    const [list, sum] = await Promise.all([listExpenses(), getCategorySummary()])
    setExpenses(list)
    setSummary(sum)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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
        <p className="text-sm opacity-80">This month</p>
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
      ) : expenses.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Wallet} title="No expenses yet" subtitle="Add your first expense to start tracking spending" />
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses
            .filter(
              (e) =>
                e.note?.toLowerCase().includes(filterQuery.toLowerCase()) ||
                e.category?.toLowerCase().includes(filterQuery.toLowerCase())
            )
            .map((e) => {
            const Icon = CATEGORY_ICONS[e.category] || MoreHorizontal
            return (
              <Card key={e.id} className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{e.category}</p>
                    <p className="text-xs text-text-muted">{e.note} · {e.spent_on}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-sm">₹{Number(e.amount).toFixed(2)}</p>
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
      )}
    </div>
  )
}