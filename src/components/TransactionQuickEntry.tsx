import { useId, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveDraftFriends, validateTransactionDraft } from '../../supabase/functions/_shared/transactionDraft'
import type { DraftFriend, TransactionDraft } from '../../supabase/functions/_shared/transactionDraft'
import Button from './Button'
import Card from './card'
import { Textarea } from './FormControls'
import FriendSelect from './FriendSelect'
import StatusMessage from './StatusMessage'

export type ReviewedDraft = TransactionDraft & { friendIds: string[] }

export default function TransactionQuickEntry({ friends, onApply }: {
  friends: DraftFriend[]; onApply: (draft: ReviewedDraft) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<TransactionDraft | null>(null)
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [unresolved, setUnresolved] = useState<string[]>([])

  async function prepare() {
    setBusy(true); setError(''); setDraft(null)
    try {
      const { data, error: requestError } = await supabase.functions.invoke('parse-transaction', { body: { text: text.trim() } })
      if (requestError) {
        let message = 'AI entry is unavailable. Try again or fill the form manually.'
        if (requestError.context instanceof Response) {
          const payload = await requestError.context.json().catch(() => null)
          if (typeof payload?.error === 'string') message = payload.error
        }
        throw new Error(message)
      }
      const parsed = validateTransactionDraft(data?.draft)
      const matched = resolveDraftFriends(parsed.friends, friends)
      setDraft(parsed); setFriendIds(matched.selectedIds); setUnresolved(matched.unresolved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare a draft. Use the form instead.')
    } finally { setBusy(false) }
  }

  const ready = draft && !draft.issues.length && friendIds.length === draft.friends.length &&
    friendIds.every((friendId) => friends.some((friend) => friend.id === friendId))

  return <Card className="quick-entry mb-6">
    <button type="button" className="quick-entry-trigger" aria-expanded={open} aria-controls={open ? `${id}-panel` : undefined} onClick={() => setOpen(!open)}>
      <span className="flex items-center gap-2"><Sparkles size={18} aria-hidden="true" />Describe a transaction</span>
      <ChevronDown size={18} aria-hidden="true" className={open ? 'rotate-180' : ''} />
    </button>
    {!open && <p className="text-sm text-text-muted mt-1">Turn a sentence into a draft you can review.</p>}
    {open && <div id={`${id}-panel`} className="mt-4">
      <label htmlFor={`${id}-description`} className="block mb-2">What happened?</label>
      <Textarea id={`${id}-description`} value={text} maxLength={1000} disabled={busy} onChange={(event) => { setText(event.target.value); setDraft(null); setError('') }}
        placeholder="I paid ₹600 for dinner with Dev and Vishnu, split equally."
        aria-describedby={`${id}-help`} />
      <p id={`${id}-help`} className="text-sm text-text-muted mt-2 mb-4">English, Hindi, or Hinglish. Include the amount, who paid, friend names, and how to split.</p>
      <Button type="button" variant="secondary" loading={busy} disabled={!text.trim()} onClick={prepare} className="w-full sm:w-auto">
        {busy ? 'Preparing draft…' : 'Prepare draft'}
      </Button>
      <p className="text-xs text-text-muted mt-3 mb-4">Your description is sent to our AI provider. Friend names are matched locally. Nothing is saved automatically.</p>
      {error && <StatusMessage>{error}</StatusMessage>}
      {draft && <section className="draft-review" aria-label="Review suggested transaction">
        <h2 className="mb-3">Review suggested details</h2>
        <dl className="draft-details">
          <div><dt>Amount</dt><dd>{draft.amount ? `₹${Number(draft.amount).toFixed(2)}` : 'Needs clarification'}{draft.mode === 'bulk' ? ' per friend' : ''}</dd></div>
          <div><dt>Type</dt><dd>{draft.mode === 'group' ? 'Equal split, including you' : draft.mode === 'bulk' ? 'Same amount each' : draft.mode === 'single' ? 'One friend' : 'Needs clarification'}</dd></div>
          <div><dt>Paid by</dt><dd>{draft.direction === 'i_paid' ? 'You' : draft.direction === 'they_paid' ? 'Your friend' : 'Needs clarification'}</dd></div>
          <div><dt>Reason</dt><dd>{draft.reason || 'Not specified'}</dd></div>
          <div><dt>Category</dt><dd className="capitalize">{draft.category}</dd></div>
        </dl>
        {draft.issues.length > 0 ? <StatusMessage tone="info"><p className="font-semibold mb-1">Clarify your description and prepare it again</p><ul className="list-disc pl-4 space-y-1">{draft.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></StatusMessage> : <>
          <p className="text-sm font-semibold mb-2">Check friends · {draft.friends.length} expected</p>
          {unresolved.length > 0 && <p className="text-sm text-text-muted mb-3">Choose the correct people for: {unresolved.join(', ')}. These names were not matched uniquely.</p>}
          <FriendSelect friends={friends} multiple={draft.mode !== 'single'} selectedIds={friendIds} onSelect={(friendId) => {
            setFriendIds((prev) => draft.mode === 'single' ? [friendId] : prev.includes(friendId) ? prev.filter((entry) => entry !== friendId) : [...prev, friendId])
          }} />
          <p className="text-sm text-text-muted mb-4">Selected: {friendIds.map((friendId) => friends.find((friend) => friend.id === friendId)?.name).join(', ') || 'None'}</p>
          <Button type="button" disabled={!ready} onClick={() => {
            if (!ready || !draft) return
            onApply({ ...draft, friendIds }); setOpen(false); setDraft(null)
          }} className="w-full">Use draft in form</Button>
          <p className="text-xs text-text-muted mt-2">Replaces the transaction details below. You can edit them before pressing Save.</p>
        </>}
      </section>}
    </div>}
  </Card>
}
