import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveDraftFriends, validateTransactionDraft } from '../supabase/functions/_shared/transactionDraft.ts'

const draft = { amount: '600.50', reason: 'Dinner', category: 'food', direction: 'i_paid', mode: 'group', friends: ['Dev', 'Vishnu'], includesSelf: true, issues: [] }

test('accepts an equal split without computing or creating a transaction', () => {
  const result = validateTransactionDraft(draft)
  assert.equal(result.amount, '600.50')
  assert.deepEqual(result.issues, [])
  assert.equal('friendIds' in result, false)
})

test('rejects unsafe and malformed model amounts and shapes', () => {
  for (const amount of ['-1', '0', '1.001', 'Infinity', '1e3', '₹600', '1,200', '1000000000', 600]) {
    assert.throws(() => validateTransactionDraft({ ...draft, amount }))
  }
  for (const patch of [{ category: 'rent' }, { mode: 'settle' }, { direction: 'payer' }, { includesSelf: 'yes' }, { friends: [''] }, { issues: [false] }]) {
    assert.throws(() => validateTransactionDraft({ ...draft, ...patch }))
  }
  assert.throws(() => validateTransactionDraft(null))
})

test('missing details require clarification rather than invented defaults', () => {
  const result = validateTransactionDraft({ ...draft, amount: null, direction: null, mode: null, friends: [] })
  assert.equal(result.amount, null)
  assert.ok(result.issues.length >= 4)
})

test('blocks unsupported group payer and exclusion of user', () => {
  assert.ok(validateTransactionDraft({ ...draft, direction: 'they_paid' }).issues.length)
  assert.ok(validateTransactionDraft({ ...draft, includesSelf: false }).issues.length)
  assert.ok(validateTransactionDraft({ ...draft, includesSelf: null }).issues.length)
  assert.ok(validateTransactionDraft({ ...draft, mode: 'single' }).issues.length)
})

test('preserves model clarification and allows supported single and bulk entries', () => {
  assert.deepEqual(validateTransactionDraft({ ...draft, issues: ['Is this a repayment?'] }).issues, ['Is this a repayment?'])
  assert.deepEqual(validateTransactionDraft({ ...draft, mode: 'single', friends: ['Dev'], direction: 'they_paid', includesSelf: null }).issues, [])
  assert.deepEqual(validateTransactionDraft({ ...draft, mode: 'bulk', includesSelf: false }).issues, [])
})

test('resolves only unique exact or whole-name prefixes, including a larger friend list', () => {
  const friends = [
    { id: 'dev', name: 'Dev' }, { id: 'vishnu', name: 'Vishnu Kumar' },
    { id: 'm1', name: 'Manash Prasad' }, { id: 'm2', name: 'Manash Burner' },
    ...Array.from({ length: 30 }, (_, i) => ({ id: `f${i}`, name: `Friend ${i}` })),
  ]
  assert.deepEqual(resolveDraftFriends([' DEV ', 'Vishnu', 'Friend 29'], friends), { selectedIds: ['dev', 'vishnu', 'f29'], unresolved: [] })
  assert.deepEqual(resolveDraftFriends(['Manash', 'Vi', 'Unknown'], friends), { selectedIds: [], unresolved: ['Manash', 'Vi', 'Unknown'] })
  assert.deepEqual(resolveDraftFriends(['Manash Prasad'], friends).selectedIds, ['m1'])
})

test('duplicate full names and duplicate references are never assigned twice', () => {
  assert.deepEqual(resolveDraftFriends(['Dev'], [{ id: '1', name: 'Dev' }, { id: '2', name: 'Dev' }]).selectedIds, [])
  assert.deepEqual(resolveDraftFriends(['Dev', 'Dev Kumar'], [{ id: '1', name: 'Dev Kumar' }]), { selectedIds: ['1'], unresolved: ['Dev Kumar'] })
})
